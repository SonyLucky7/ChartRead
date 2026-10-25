import { Session, session } from 'electron';
import { Subject, Subscription } from 'rxjs';

import { get, HttpResponse, HttpResponseCode, post } from '../../http';
import { ExposeSingletonService, IpcServices } from '../../ipc-services';
import { loggerService } from '../../logger';
import { logCall, logCallName } from '../../logger/log-decorator';
import { AttachPersistentRoot, PersistentCompoundObject, PersistentField } from '../../persistence';
import { API_CHART_TOKEN, API_DELETE_LAYOUT, API_GET_LAYOUT_DRAWINGS_INFO } from '../../tv-api';
import { resolveWebsiteRoot } from '../../tv-api/url-helpers';
import { assertNumber } from '../../utils';
import { jsonParse, safeJsonParse } from '../../utils/json-parse';
import { appSettingsService } from '../app-settings-service';
import { getConfiguration } from '../configuration';
import { settingsProvider } from '../settings';
import { userService } from '../user';
import { windowService } from '../window';
import {
	ChartItem,
	CopyLayoutOptions,
	CreateLayoutHelperOptions,
	INewTabService,
	isJwtTokenResponse,
	isLayoutDrawingsCountResponse,
	isProductState,
	LayoutDrawingsCount,
	LayoutResponse,
	Layouts,
	NEW_TAB_SERVICE_CONTRACT,
	PageMetadata,
	productIds,
	ProductStates,
	ResponseData,
	ResponseItem,
	SortData,
	SortDirection,
	SortField,
} from './inew-tab-service';

@ExposeSingletonService(NEW_TAB_SERVICE_CONTRACT, IpcServices.getProvider())
@AttachPersistentRoot('new-tab')
@PersistentCompoundObject
@logCallName('NewTabService')
export class NewTabService implements INewTabService {
	private isSeeOnboardingBefore: Subscription;

	private readonly layoutsEventSubject = new Subject<void>();
	readonly layoutsEvent = this.layoutsEventSubject.asObservable();

	private targetTvHost = getConfiguration().urls.defaultHost;

	@PersistentField({ name: 'layoutSort' })
	readonly layoutSort: SortData = { sortField: SortField.Title, sortDirection: SortDirection.Asc };

	@PersistentField({ name: 'productDrawerButton' })
	private readonly productDrawerButton: { showHint: boolean; } = { showHint: true };

	@PersistentField({ name: 'tvMcpServer' })
	private readonly tvMcpServer: { showHint: boolean; } = { showHint: true };

	@PersistentField({ name: 'products' })
	private readonly productStates: Record<string, unknown> = {};

	constructor() {
		this.isSeeOnboardingBefore = settingsProvider().isSeeOnboardingBeforeSubject.subscribe(isSeeOnboardingBefore => {
			appSettingsService().set('isSeeOnboardingBefore', isSeeOnboardingBefore);
		});

		userService().userSignedOut.subscribe(() => {
			this.layoutSort.sortDirection = SortDirection.Asc;
			this.layoutSort.sortField = SortField.Title;

			productIds.forEach((productId) => {
				this.productStates[productId] = undefined;
			});

			this.productDrawerButton.showHint = true;
			this.tvMcpServer.showHint = true;
		});
	}

	public dispose(): void {
		this.isSeeOnboardingBefore?.unsubscribe();
	}

	public showSignInDialog(): void {
		userService().doSignIn('new_product_tab');
	}

	public saveSortDirection({ sortDirection, sortField }: SortData): void {
		this.layoutSort.sortDirection = sortDirection;
		this.layoutSort.sortField = sortField;
	}

	public getSortDirection(): SortData {
		const { sortDirection, sortField } = this.layoutSort;

		return { sortDirection, sortField };
	}

	public getShowProductDrawerHint(): boolean {
		return this.productDrawerButton.showHint;
	}

	public setShowProductDrawerHint(showHint: boolean): void {
		this.productDrawerButton.showHint = showHint;
	}

	public getShowTvMcpServerHint(): boolean {
		return this.tvMcpServer.showHint;
	}

	public setShowTvMcpServerHint(showHint: boolean): void {
		this.tvMcpServer.showHint = showHint;
	}

	public getProductStates(): ProductStates {
		const productStates: ProductStates = {};

		productIds.forEach((id) => {
			const productState = this.productStates[id];

			if (productState !== undefined && isProductState(productState)) {
				productStates[id] = { ...productState };
			}
		});

		return productStates;
	}

	public setProductStates(productStates: ProductStates): void {
		Object.entries(productStates).forEach(([key, value]) => {
			this.productStates[key] = value;
		});
	}

	private async createLayoutHelper({ body, url, tabId }: CreateLayoutHelperOptions): Promise<LayoutResponse> {
		const ses = session.defaultSession;
		if (!ses) {
			throw new Error('NewTabService.createLayoutHelper(): no default session');
		}

		const headers = {
			/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
			'Accept': '*/*',
			'Referer': `${ this.targetTvHost }`,
			'Content-Type': 'application/json',
			/* eslint-enable camelcase, @typescript-eslint/naming-convention */
		};

		const requestData = { headers, body };

		const response = await post({ url, requestData, session: ses });
		if (response.code !== HttpResponseCode.OK) {
			const isResponseData = (value: any): value is ResponseData => {
				return typeof value === 'object' && 'detail' in value;
			};

			const responseData = safeJsonParse(isResponseData)(response.data?.toString() ?? '');
			if (!responseData) {
				loggerService().error('NewTabService.createLayoutHelper(): JSON.parse error');
				return 'error';
			}

			this.layoutsEventSubject.next();
			return responseData.code;
		}
		else {
			if (response.headers?.location) {
				this.loadURL({ url: response.headers.location, tabId });
			}

			this.layoutsEventSubject.next();
			return 'success';
		}
	}

	@logCall
	public async createLayout(layoutName: string, tabId?: string): Promise<LayoutResponse> {
		const url = resolveWebsiteRoot('/charts/');
		return this.createLayoutHelper({ body: { name: layoutName }, tabId, url });
	}

	@logCall
	public copyLayout({ layoutId, layoutName, tabId }: CopyLayoutOptions): Promise<string> {
		const url = resolveWebsiteRoot(`/charts/${ layoutId }/clone/`);

		const body = {
			name: layoutName,
		};

		return this.createLayoutHelper({ body, tabId, url });
	}

	@logCall
	public async deleteLayout(layoutId: string): Promise<void> {
		const ses = session.defaultSession;

		if (!ses) {
			throw new Error('NewTabService.removeLayout(): no default session');
		}

		const url = resolveWebsiteRoot(API_DELETE_LAYOUT);
		const requestData = {
			headers: {
				/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
				'Accept': '*/*',
				'Referer': `${ this.targetTvHost }`,
				'Content-Type': 'application/json',
				/* eslint-enable camelcase, @typescript-eslint/naming-convention */
			},
			body: {
				uid: [layoutId],
			},
		};

		try {
			await post({ url, requestData, session: ses });
			this.layoutsEventSubject.next();
		}
		catch (error) {
			loggerService().error('NewTabService.removeLayout(): post() error', error);
		}
	}

	@logCall
	public async getLayoutDrawingsCount(layoutId: string, userId: string): Promise<LayoutDrawingsCount> {
		const ses = session.defaultSession;
		if (!ses) {
			throw new Error('[NewTabService.getLayoutDrawingsCount()]: no default session');
		}

		const getDrawingsCount = async(forceCacheReload?: true): Promise<HttpResponse> => {
			const urlJwt = resolveWebsiteRoot(`${ API_CHART_TOKEN }?image_url=${ layoutId }&user_id=${ userId }`);

			const jwt = await this.getJwtForDrawingsInfo(urlJwt, ses, forceCacheReload);

			const urlDrawingsCount = `${ API_GET_LAYOUT_DRAWINGS_INFO }${ layoutId }/sizes?jwt=${ jwt }`;

			return await get({ url: urlDrawingsCount });
		};

		let response;
		try {
			response = await getDrawingsCount();
		}
		catch (error) {
			loggerService().error('[NewTabService.getLayoutDrawingsCount()]: getDrawingsCount() error', error);

			response = await getDrawingsCount(true);
		}

		const drawingsCount = safeJsonParse(isLayoutDrawingsCountResponse)(response.data?.toString() ?? '');

		if (!drawingsCount?.payload) {
			throw new Error('[NewTabService.getLayoutDrawingsCount()]: no drawings info');
		}

		const { charts: rawCharts = {} } = drawingsCount.payload;
		const allDrawings: string[] = [];
		const uniqueSymbols = new Set();

		Object.values(rawCharts).forEach(({ symbols }) => {
			Object.entries(symbols).forEach(([symbol, { ids }]) => {
				uniqueSymbols.add(symbol);

				allDrawings.push(...ids);
			});
		});

		return { drawings: new Set(allDrawings).size, symbols: uniqueSymbols.size };
	}

	@logCall
	private async getJwtForDrawingsInfo(url: string, ses: Session, forceCacheReload?: true): Promise<string> {
		const response = await get({
			url,
			cache: forceCacheReload ? 'reload' : 'default',
			session: ses,
		});

		const jwt = safeJsonParse(isJwtTokenResponse)(response.data?.toString() ?? '')?.token;
		if (!jwt) {
			throw new Error('NewTabService.getLayoutDrawingsInfo(): no jwt token');
		}

		return jwt;
	}

	public getFullLayoutUrl(chartUrl: string): string {
		return resolveWebsiteRoot(`/chart/${ chartUrl }/`);
	}

	@logCall
	public loadURL(metadata: PageMetadata, inNewTab = false): void {
		const { tabId, url, title } = metadata;

		const wnd = tabId
			? windowService().findWindow({ tabId })
			: windowService().getLastFocusedWindow();

		if (wnd === undefined || wnd.activeTabId === null) {
			return;
		}

		if (inNewTab) {
			wnd.createAndAddTab({
				title,
				url,
				active: false,
			})
				.catch((error) => loggerService().error('NewTabService.loadURL(): in new tab error', error));

			return;
		}

		wnd.replaceTab({
			id: wnd.activeTabId,
			url,
			title,
			pinned: wnd.getIsTabPinned(wnd.activeTabId),
		})
			.catch((error) => loggerService().error('NewTabService.loadURL(): error', error));
	}

	public async getLayouts(): Promise<Layouts> {
		const url = resolveWebsiteRoot('/my-charts/');

		const ses = session.defaultSession;
		if (!ses) {
			throw new Error('NewTabService.getLayouts(): no default session');
		}

		const response = await get({ url, session: ses });

		let responseData;
		try {
			responseData = jsonParse<Array<ResponseItem>>(response?.data?.toString() ?? '');
		}
		catch (error) {
			loggerService().error('NewTabService.getLayouts(): JSON.parse error', error);
		}

		if (!Array.isArray(responseData)) {
			throw new TypeError('NewTabService.getLayouts(): response data from settings API is not an array');
		}

		const layouts = responseData.filter(i => !!i && typeof i === 'object')
			.map<ChartItem>((layout) =>
				({
					id: assertNumber(layout.id),
					url: layout.url,
					title: layout.name,
					symbol: layout.short_symbol || layout.short_name || layout.symbol || '',
					logoUrls: [],
					interval: layout.interval,
					modified: layout.modified_iso,
					favorite: layout.favorite,
				}));

		return { layouts };
	}

	@logCall
	public async updateFavoriteLayout(idChart: string, isFavorite: boolean): Promise<boolean> {
		const url = resolveWebsiteRoot(`/my-charts/${ idChart }/change-favorite-state/`);

		const ses = session.defaultSession;
		if (!ses) {
			throw new Error('NewTabService.updateFavoriteLayout(): no default session');
		}

		const requestData = {
			headers: {
				/* eslint-disable camelcase, @typescript-eslint/naming-convention*/
				'Accept': '*/*',
				'Referer': `${ this.targetTvHost }`,
				'Content-Type': 'application/json',
				/* eslint-enable camelcase, @typescript-eslint/naming-convention */
			},
			body: {
				content: JSON.stringify({ favorite: isFavorite }),
			},
		};

		try {
			const response = await post({ url, requestData, session: ses });

			if (response.code !== HttpResponseCode.OK) {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				throw new Error(`HttpResponseCode ${ response.code } (${ response.errorMessage || 'undefined error message' })`);
			}

			return true;
		}
		catch (error) {
			loggerService().error('NewTabService.updateFavoriteLayout(): no response error', error);
		}

		return false;
	}
}
