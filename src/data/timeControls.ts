
export const TIME_CONTROLS = [
  { label: 'Blitz - 3+2', value: '3+2' },
  { label: 'Blitz - 5+0', value: '5+0' },
  { label: 'Rapid - 15+10', value: '15+10' },
  { label: 'Rapid - 25+10', value: '25+10' },
  { label: 'Classical - 90+30', value: '90+30' },
  { label: 'Custom', value: 'custom' }
] as const;

export type TimeControlValue = typeof TIME_CONTROLS[number]['value'];
