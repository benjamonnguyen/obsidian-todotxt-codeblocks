import { moment } from 'obsidian';
import { Moment } from 'moment';

export function calculateDate(
	value: string,
	from: Moment | null = null,
): { date: string; details: string | undefined } {
	// <YYYY-MM-DD> (ex. 1996-08-06)
	let date: Moment = moment(value, 'YYYY-MM-DD', true);
	if (date.isValid()) return { date: date.format('YYYY-MM-DD'), details: undefined };
	// <MM-DD> (ex. 08-06)
	date = moment(value, 'MM-DD', true);
	if (date.isValid()) return { date: date.format('YYYY-MM-DD'), details: undefined };

	const dateCalculationDetails: string[] = [];
	// <number><[dateUnit]> (ex. 1d)
	// dateUnits: d, w, m, y
	// if only number is provided, unit is days (ex. 0 = today)
	const dateUnits = extractDateUnits(value);

	// <dayOfWeek>
	// M, Tu, W, Th, F, Sa, Su
	// dayOfWeek must be at the very beginning or end
	const dayOfWeek = /(^(?:M|Tu|W|Th|F|Sa|Su)|(?:M|Tu|W|Th|F|Sa|Su)$)/.exec(value)?.at(1);
	// can be combined
	// 1w2d = 9 days (1 week + 2 days)
	// 2mM = first Monday in 2 months
	// M2m = first Monday in 2 months
	if (dateUnits || dayOfWeek) {
		date = from || moment();
		if (dateUnits) {
			if (dateUnits.b) {
				let b = dateUnits.b;
				while (b) {
					date.add(1, 'd');
					if (date.isoWeekday() < 6) {
						b--;
					}
				}
			} else {
				date
					.add(dateUnits.d, 'd')
					.add(dateUnits.w, 'w')
					.add(dateUnits.m, 'M')
					.add(dateUnits.y, 'y');
			}
		}

		if (dayOfWeek) {
			const targetDate = date.clone();
			date.day(['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].indexOf(dayOfWeek));
			if (date.isBefore(targetDate) || (date.isSame(targetDate) && !dateUnits)) date.add(7, 'd');
			dateCalculationDetails.push('dayOfWeek: ' + dayOfWeek);
		}
		for (const dateUnit in dateUnits) {
			// @ts-ignore
			const val = dateUnits[dateUnit];
			if (val !== undefined) {
				dateCalculationDetails.push(dateUnit + ': ' + val);
			}
		}

		return { date: date.format('YYYY-MM-DD'), details: dateCalculationDetails.join(', ') };
	}

	throw new Error();
}

export function extractDateUnits(value: string):
	| {
			d: number | undefined;
			w: number | undefined;
			m: number | undefined;
			y: number | undefined;
			b: number | undefined;
	  }
	| undefined {
	const d = /^\+?\d+$/.exec(value)?.first() || /(\d+)d/.exec(value)?.at(1);
	const w = /(\d+)w/.exec(value)?.at(1);
	const m = /(\d+)m/.exec(value)?.at(1);
	const y = /(\d+)y/.exec(value)?.at(1);
	const b = /(\d+)b/.exec(value)?.at(1);

	if (b && (d || w || m || y)) {
		throw new Error('b(usiness day) cannot be combined with other dateUnits');
	}
	if (!(d || w || m || y || b)) return;

	return {
		d: d ? parseInt(d) : undefined,
		w: w ? parseInt(w) : undefined,
		m: m ? parseInt(m) : undefined,
		y: y ? parseInt(y) : undefined,
		b: b ? parseInt(b) : undefined,
	};
}