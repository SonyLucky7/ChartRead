import React, { Component } from 'react';

import { logCall, logCallName } from '../../../../logger/log-decorator';
import { NavigationKeys } from '../../../common/interfaces';
import { TranslationContext } from '../../../common/react-common';
import { ComboboxItem } from './combobox-item';

import Arrow from '../../../assets/drop-down-arrow.svg';

import './combobox.css';

interface Props<K extends string, V extends string> {
	items: ComboboxItem<K, V>[];
	onChange(id: K, label: V): void;
	tabIndex: number;
	defaultSelectedId?: string;
	hasKeyboardNavigation?: boolean;
	isDisabled?: boolean;
}

interface State {
	showDropdown: boolean;
	selectedId?: string;
	currentId?: string;
}

@logCallName('ComboboxComponent')
export default class ComboboxComponent<K extends string = string, V extends string = string> extends Component<Props<K, V>, State> {
	static override contextType = TranslationContext;
	declare context: React.ContextType<typeof TranslationContext>;

	private readonly shiftDropdown = '32px';

	override state: State = {
		showDropdown: false,
		selectedId: undefined,
		currentId: undefined,
	};

	private comboDropdownRef?: React.RefObject<HTMLUListElement>;
	private containerDropdownRef?: React.RefObject<HTMLDivElement>;

	override componentDidMount(): void {
		if (this.props.hasKeyboardNavigation) {
			document.addEventListener('keyup', this.keyUpHandler);
		}
		document.addEventListener('click', this.onClickOutsideDropdown);
		if (!this.props.defaultSelectedId) {
			this.setState({ selectedId: this.props.items[0]?.id, currentId: this.props.items[0]?.id });
		}

		this.comboDropdownRef = React.createRef();
		this.containerDropdownRef = React.createRef();
	}

	override componentWillUnmount(): void {
		if (this.props.hasKeyboardNavigation) {
			document.removeEventListener('keyup', this.keyUpHandler);
		}
		document.removeEventListener('click', this.onClickOutsideDropdown);
	}

	private keyUpHandler = (ev: KeyboardEvent): void => {
		if (!ev.target || !(ev.target instanceof HTMLElement) || !this.containerDropdownRef?.current?.contains(ev.target)) {
			return;
		}

		const { showDropdown } = this.state;
		// TODO: break the condition into smaller parts/variables to get rid of "no-mixed-operators"
		// eslint-disable-next-line no-mixed-operators
		if (ev.code === 'Space' || ev.code === 'Enter' || !showDropdown && (ev.code === NavigationKeys.Down || ev.code === NavigationKeys.Up)) {
			ev.preventDefault();
			if (this.state.showDropdown) {
				const currentElement = this.containerDropdownRef?.current?.querySelector('.combobox-dropdown-item.key-tab-focus');

				if (!currentElement) {
					return;
				}

				if (currentElement instanceof HTMLElement) {
					const { dataset: { id } } = currentElement;
					const { items } = this.props;
					const indexCurrentItem = items.findIndex(item => item.id === id);

					if (!id) {
						return;
					}
					this.props.onChange(id as K, items[indexCurrentItem].label);
					this.setState({ showDropdown: false });
				}
			}
			else {
				const selectedElement = this.containerDropdownRef?.current?.querySelector('.combobox-dropdown-item.selected');
				if (!selectedElement) {
					return;
				}
				if (selectedElement instanceof HTMLElement) {
					this.setState({ showDropdown: true, currentId: selectedElement.dataset.id });
					selectedElement.focus();
				}
			}
		}
		else if (Object.values(NavigationKeys).includes(ev.key as NavigationKeys)) {
			ev.preventDefault();
			const currentElement = this.containerDropdownRef?.current?.querySelector('.combobox-dropdown-item.key-tab-focus');
			if (currentElement instanceof HTMLElement) {
				const { dataset: { id } } = currentElement;
				const { items } = this.props;
				const indexActiveTab = items.findIndex(item => item.id === id);

				if (!id) {
					return;
				}

				switch (ev.key) {
					case NavigationKeys.Down:
					case NavigationKeys.Right: {
						const nextIndexTab = indexActiveTab === items.length - 1 ? 0 : indexActiveTab + 1;
						this.changeItemFocus(currentElement, nextIndexTab);
						break;
					}
					case NavigationKeys.Up:
					case NavigationKeys.Left: {
						const previousIndexTab = indexActiveTab - 1 >= 0 ? indexActiveTab - 1 : items.length - 1;
						this.changeItemFocus(currentElement, previousIndexTab);
						break;
					}
				}
			}
		}
	};

	private changeItemFocus(prevItem: HTMLElement, nextIndex: number): void {
		const itemsNodeList = this.containerDropdownRef?.current?.querySelectorAll('.combobox-dropdown-item');

		if (!itemsNodeList) {
			return;
		}

		prevItem.classList.remove('key-tab-focus');
		if (itemsNodeList[nextIndex] && itemsNodeList[nextIndex] instanceof HTMLElement) {
			itemsNodeList[nextIndex].classList.add('key-tab-focus');
		}
	}

	override render(): React.ReactNode {
		return (
			<div
				ref={ this.containerDropdownRef }
				tabIndex={ this.props.tabIndex || 0 }
				onBlur={ () => { this.setState({ showDropdown: false }); } }
				className={ `combobox-container ${ this.props.isDisabled ? 'disabled' : '' } ${ this.state.showDropdown ? 'expanded' : '' }` }
				onClick={ (ev) => this.toggleDropdown(ev) }
			>
				<span className='combobox-label'>{ this.getSelectedItemLabel() }</span>
				<span className={ `combobox-icon${ this.state.showDropdown ? ' rotated' : '' }` }>
					<Arrow />
				</span>

				{ !this.props.isDisabled &&
					<ul
						ref={ this.comboDropdownRef }
						className={ `combobox-dropdown${ this.state.showDropdown ? ' visible' : '' }` }
					>
						{ this.renderDropdownItems() }
					</ul>
				}
			</div>
		);
	}

	private onClickOutsideDropdown = (ev: MouseEvent): void => {
		if (
			ev.target instanceof Node &&
			!this.containerDropdownRef?.current?.contains(ev.target) &&
			this.state.showDropdown
		) {
			ev.preventDefault();
			this.setState({ showDropdown: false });
		}
	};

	@logCall
	private toggleDropdown(ev: React.MouseEvent): void {
		if (this.props.isDisabled) {
			return;
		}

		ev.preventDefault();

		if (this.props.isDisabled) {
			return;
		}

		this.setState({ showDropdown: !this.state.showDropdown });

		if (this.comboDropdownRef?.current) {
			const comboRect = this.comboDropdownRef.current.getBoundingClientRect();

			if (comboRect.height + comboRect.y > document.body.clientHeight) {
				this.comboDropdownRef.current.style.top = 'auto';
				this.comboDropdownRef.current.style.bottom = this.shiftDropdown;
			}
			else {
				this.comboDropdownRef.current.style.top = this.shiftDropdown;
				this.comboDropdownRef.current.style.bottom = 'auto';
			}
		}
	}

	private getSelectedItemLabel(): string {
		const selectedId = this.state.selectedId ?? this.props.defaultSelectedId;
		const selectedItem = this.props.items.find(i => i.id === selectedId);

		return selectedItem?.label ?? this.props.items[0]?.label;
	}

	private renderDropdownItems(): JSX.Element[] {
		const selectedId = this.state.selectedId ?? this.props.defaultSelectedId;

		return this.props.items.map(i =>
			<li key={ i.id }
				data-id={ i.id }
				className={ `combobox-dropdown-item${ i.id === selectedId ? ' selected' : '' }${ i.id === this.state.currentId ? ' key-tab-focus' : '' }` }
				onClick={ (ev) => this.onDropdownItemClick(ev, i.id, i.label) }>
				{ i.label }
			</li>
		);
	}

	@logCall
	private onDropdownItemClick(ev: React.MouseEvent, id: K, label: V): void {
		ev.stopPropagation();

		this.setState({ selectedId: id, showDropdown: false });
		this.props.onChange(id, label);
	}
}
