import { ClientRequestConstructorOptions, net, Session } from 'electron';

import { loggerService } from '../logger';
import { getProxyLoginAndPassword } from '../main/network/proxy-credentials';
import { getMessageOfError } from '../tvd-runtime/core';

export enum HttpResponseCode {
	OK = 200,
	Redirect = 302,
	ApplicationError = 400,
	Forbidden = 403,
	Conflict = 409,
	NotFound = 404,
	TooManyRequests = 429,
	InternalError = 500,
}

export interface HttpRequestBody {
	content?: string | Buffer;
	contentType?: string;
	name?: string;
	uid?: string[];
}

export interface HttpRequestData {
	headers?: Record<string, string>;
	body?: HttpRequestBody;
	redirectHandler?(url: string): Buffer | undefined;
}

export interface HttpRequestOptions {
	method: string;
	url: string;
	cache?: ClientRequestConstructorOptions['cache'];
	requestData?: HttpRequestData;
	session?: Session;
	timeout?: number;
}

export type GetHttpRequestOptions = Omit<HttpRequestOptions, 'method' | 'requestData'>;
export type PostHttpRequestOptions = Omit<HttpRequestOptions, 'method' | 'forceCacheReload' | 'timeout'>;
export type HeadHttpRequestOptions = Pick<HttpRequestOptions, 'url' | 'session'>;

export interface HttpHeaderData {
	['content-length']?: string;
	['content-type']?: string;
	date?: string;
	expires?: string;
	location?: string;
	etag?: string;
}

export interface HttpResponse {
	code?: number;
	errorMessage?: string;
	data?: Buffer;
	headers?: HttpHeaderData;
}

export async function request({
	method,
	url,
	cache = 'default',
	requestData,
	session,
	timeout,
}: HttpRequestOptions): Promise<HttpResponse> {
	return new Promise((resolve, reject) => {
		try {
			const req = net.request({
				useSessionCookies: true,
				method,
				url,
				cache,
				session,
			});

			let resolved = false;
			let timeoutAbort = true;
			if (timeout) {
				setTimeout(() => {
					if (timeoutAbort && !resolved) {
						req.abort();
						reject(new Error('Response timeout'));
					}
				}, timeout);
			}

			const redirectHandler = requestData?.redirectHandler;
			if (redirectHandler) {
				req.on('redirect', (code: number, redirectMethod: string, redirectUrl: string) => {
					if (resolved) {
						return false;
					}

					if (code === HttpResponseCode.Redirect) {
						const value = redirectHandler(redirectUrl);
						if (typeof value === 'undefined') {
							return;
						}

						resolved = true;
						req.abort();
						resolve({ data: value });
					}
				});
			}

			req.on('response', (res) => {
				let inboundData: Buffer;
				const headers = res.headers as unknown as HttpHeaderData;
				timeoutAbort = false;
				res.on('data', (chunk) => {
					if (inboundData) {
						inboundData = Buffer.concat([inboundData, chunk]);
					}
					else {
						inboundData = Buffer.from(chunk);
					}
				});

				res.on('end', () => {
					if (res.statusCode >= HttpResponseCode.ApplicationError) {
						const stCode = res.statusCode ?? 0;
						const stMessage = res.statusMessage ?? inboundData?.toString();
						const message = `${ stCode } / ${ stMessage ?? 'Unknown error' }`;
						resolve({ errorMessage: message, data: inboundData, code: stCode });
					}

					resolve({ data: inboundData, code: HttpResponseCode.OK, headers });
				});

				res.on('error', () => {
					reject(new Error('Response error'));
				});

				res.on('aborted', () => {
					reject(new Error('Response aborted'));
				});
			});

			req.on('error', (err) => {
				reject(err);
			});

			req.on('login', (authInfo, callback) => {
				loggerService().info('Proxy connection: try login to proxy');

				getProxyLoginAndPassword()
					.then((proxyCredentials) => {
						if (!proxyCredentials) {
							return;
						}

						const { account, password } = proxyCredentials;

						callback(account, password);
					})
					.catch((error) => {
						loggerService().error(
							'getProxyLoginAndPassword(): Problems with fetching proxy credentials - ',
							getMessageOfError(error)
						);
					});
			});

			req.setHeader('X-Requested-With', 'XMLHttpRequest');

			if (requestData) {
				if (requestData.headers) {
					for (const key of Object.getOwnPropertyNames(requestData.headers)) {
						const value = requestData.headers[key];
						req.setHeader(key, value);
					}
				}

				if (requestData.body) {
					if (requestData.body.contentType && typeof requestData.body.contentType === 'string') {
						req.setHeader('Content-Type', requestData.body.contentType);
					}
					if (requestData.body.content) {
						req.write(requestData.body.content);
					}
					else {
						req.write(JSON.stringify(requestData.body));
					}
				}
			}

			req.end();
		}
		catch (err) {
			reject(err);
		}
	});
}

export async function get({ url, cache, session, timeout }: GetHttpRequestOptions): Promise<HttpResponse> {
	return request({ method: 'GET', url, cache, requestData: undefined, session, timeout });
}

export async function post({ url, requestData, session }: PostHttpRequestOptions): Promise<HttpResponse> {
	return request({ method: 'POST', url, requestData, session });
}

export async function head({ url, session }: HeadHttpRequestOptions): Promise<HttpResponse> {
	return request({ method: 'HEAD', url, requestData: undefined, session });
}
