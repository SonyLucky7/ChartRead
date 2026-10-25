import { GroupName } from '../../linking/group-names';

export type LinkColor = GroupName;

interface LinkColorStyles {
	backgroundColor: string;
}

export const linkPallette = new Map<LinkColor, LinkColorStyles>([
	['Red', { backgroundColor: '#F23645' }],
	['Green', { backgroundColor: '#4CAF50' }],
	['Blue', { backgroundColor: '#3179F5' }],
	['Yellow', { backgroundColor: '#FDD835' }],
	['Orange', { backgroundColor: '#FB8C00' }],
	['Sky Blue', { backgroundColor: '#00BCD4' }],
	['Grapes Purple', { backgroundColor: '#9C27B0' }],
	['Rose', { backgroundColor: '#FF80AB' }],
	['Purple', { backgroundColor: '#651FFF' }],
]);
