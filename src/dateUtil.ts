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

	const dateOptions = extractDateOptions(value);
	date = from || moment();
	if (dateOptions.hasOwnProperty('b')) {
		let b = (dateOptions as { b: number }).b;
		const details = 'b: ' + b;
		while (b) {
			date.add(1, 'd');
			if (date.isoWeekday() < 6) {
				b--;
			}
		}

		return { date: date.format('YYYY-MM-DD'), details };
	}

	const opts = dateOptions as {
		d: number | undefined;
		w: number | undefined;
		m: number | undefined;
		y: number | undefined;
		dayOfWeek: string | undefined;
	};
	date.add(opts.d, 'd').add(opts.w, 'w').add(opts.m, 'M').add(opts.y, 'y');
	if (opts.dayOfWeek) {
		const targetDate = date.clone();
		date.day(['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].indexOf(opts.dayOfWeek));
		if (
			date.isBefore(targetDate) ||
			(date.isSame(targetDate) && !(opts.d || opts.w || opts.m || opts.y))
		)
			date.add(7, 'd');
	}

	const dateCalculationDetails: string[] = [];
	for (const opt in opts) {
		// @ts-ignore
		const val = opts[opt];
		if (val !== undefined) {
			dateCalculationDetails.push(opt + ': ' + val);
		}
	}

	return { date: date.format('YYYY-MM-DD'), details: dateCalculationDetails.join(', ') };
}

export function extractDateOptions(value: string):
	| {
			d: number | undefined;
			w: number | undefined;
			m: number | undefined;
			y: number | undefined;
			dayOfWeek: string | undefined;
	  }
	| { b: number } {
	let d: number | undefined;
	let w: number | undefined;
	let m: number | undefined;
	let y: number | undefined;
	let dayOfWeek: string | undefined;

	const bareDayMatch = value.match(/^\+?(\d+)$/);
	if (bareDayMatch) {
		d = parseInt(bareDayMatch[1]);
		return { d, w, m, y, dayOfWeek };
	}
	const businessDayMatch = value.match(/^\+?(\d+)b$/);
	if (businessDayMatch) {
		const b = parseInt(businessDayMatch[1]);
		return { b };
	}
	const match = value.match(/^\+?(?:M|Tu|W|Th|F|Sa|Su)?(?:\d+[dwmy]){0,4}$/);
	if (!match) {
		if (/\d+b/.test(value)) {
			throw new Error('b(usiness day) cannot be combined with other options');
		}
		throw new Error('Input does not match RegExp: /^\\+?(M|Tu|W|Th|F|Sa|Su)?(\\d+[dwmy]){0,4}$/');
	}
	const dayOfWeekMatch = value.match(/M|Tu|W|Th|F|Sa|Su/);
	if (dayOfWeekMatch) dayOfWeek = dayOfWeekMatch[0];
	const dMatches = Array.from(value.matchAll(/(\d+)d/g));
	if (dMatches.length) {
		if (dMatches.length > 1) {
			throw new Error('Input contains more than one d(ay) option');
		}
		d = parseInt(dMatches[0][1]);
	}
	const wMatches = Array.from(value.matchAll(/(\d+)w/g));
	if (wMatches.length) {
		if (wMatches.length > 1) {
			throw new Error('Input contains more than one w(eek) option');
		}
		w = parseInt(wMatches[0][1]);
	}
	const mMatches = Array.from(value.matchAll(/(\d+)m/g));
	if (mMatches.length) {
		if (mMatches.length > 1) {
			throw new Error('Input contains more than one m(onth) option');
		}
		m = parseInt(mMatches[0][1]);
	}
	const yMatches = Array.from(value.matchAll(/(\d+)y/g));
	if (yMatches.length) {
		if (yMatches.length > 1) {
			throw new Error('Input contains more than one y(ear) option');
		}
		y = parseInt(yMatches[0][1]);
	}

	return { d, w, m, y, dayOfWeek };
}
