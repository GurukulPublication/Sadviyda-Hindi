/**
 * Six fake articles so the dashboard can be seen fully populated.
 * Everything here is marked isDemo: true and can be removed in one click.
 */

import type { Flag, ParameterKey, Report } from '../types'

let counter = 0
function f(
  parameter: ParameterKey,
  status: 'FLAGGED' | 'UNSURE',
  line: number,
  english: string,
  hindi: string,
  reason: string,
  term?: string,
): Flag {
  counter += 1
  return {
    id: `demo-${counter}`,
    line,
    english,
    hindi,
    parameter,
    status,
    reason,
    term,
  }
}

export const DEMO_LABEL = 'Demo'

export function demoReports(): Report[] {
  const now = new Date().toISOString()
  const reports: Report[] = [
    {
      title: 'Demo — The Lamp Before Dawn',
      date: '2025-11-08',
      language: 'Hindi',
      status: 'FLAGGED',
      isDemo: true,
      createdAt: now,
      flags: [
        f(
          'meaningDrift',
          'FLAGGED',
          6,
          'He had not yet let go of body-consciousness.',
          'उसने अभी तक शरीर का मोह नहीं छोड़ा था।',
          '"dehbhav" is a narrower idea than "moh"; the Hindi softens it.',
          'dehbhav',
        ),
        f(
          'meaningDrift',
          'FLAGGED',
          14,
          'The doubt did not leave him; it simply went quiet.',
          'संदेह उसे छोड़ गया और शांत हो गया।',
          'The Hindi says the doubt left, which is the opposite of the English.',
        ),
        f(
          'naturalPhrasing',
          'FLAGGED',
          9,
          'He walked towards the temple with a heart full of longing.',
          'वह मंदिर की ओर चला एक हृदय के साथ जो लालसा से भरा था।',
          'The Hindi copies English clause order.',
        ),
        f(
          'naturalPhrasing',
          'FLAGGED',
          21,
          'It was then that he understood.',
          'यह तब था कि उसने समझा।',
          'A direct calque of the English cleft sentence.',
        ),
        f(
          'termConsistency',
          'FLAGGED',
          17,
          'as the Vachanamrut says',
          'जैसा वचनामृत में कहा गया है',
          'Spelt "वचनामृत" here but "वचनामृतम्" later in the same article.',
          'Vachanamrut',
        ),
        f(
          'voiceConviction',
          'FLAGGED',
          25,
          'This is the only way.',
          'यह एक मार्ग हो सकता है।',
          'The conviction of the English is lost entirely.',
        ),
        f(
          'voiceConviction',
          'UNSURE',
          30,
          'Nothing else will do.',
          'और कुछ उचित नहीं होगा।',
          'Slightly formal, but arguably fine. Your call.',
        ),
      ],
    },
    {
      title: 'Demo — What the River Carries',
      date: '2025-12-02',
      language: 'Hindi',
      status: 'FLAGGED',
      isDemo: true,
      createdAt: now,
      flags: [
        f(
          'meaningDrift',
          'FLAGGED',
          11,
          'He gave up the idea of being the doer.',
          'उसने कर्ता होने का विचार त्याग दिया।',
          '"kartapan" would be the exact idea; "विचार" makes it a thought, not a stance.',
          'kartapan',
        ),
        f(
          'naturalPhrasing',
          'FLAGGED',
          4,
          'There was a silence that filled the courtyard.',
          'एक मौन था जो आँगन को भरता था।',
          'English relative-clause order carried straight over.',
        ),
        f(
          'termConsistency',
          'FLAGGED',
          19,
          'Akshardham is not a place you reach by walking.',
          'अक्षरधाम कोई ऐसी जगह नहीं जहाँ चलकर पहुँचा जाए।',
          '"अक्षरधाम" used here, "अक्षर धाम" (with a space) elsewhere.',
          'Akshardham',
        ),
        f(
          'voiceConviction',
          'FLAGGED',
          26,
          'Hold on to this and nothing can shake you.',
          'इसे पकड़े रहने से लाभ हो सकता है।',
          'A firm instruction has become a mild suggestion.',
        ),
        f(
          'naturalPhrasing',
          'UNSURE',
          31,
          'Slowly, slowly, the mind settles.',
          'धीरे-धीरे मन बैठ जाता है।',
          'Possibly fine; "शांत होता है" may read better.',
        ),
      ],
    },
    {
      title: 'Demo — A Seat at the Back',
      date: '2026-01-05',
      language: 'Hindi',
      status: 'FLAGGED',
      isDemo: true,
      createdAt: now,
      flags: [
        f(
          'meaningDrift',
          'FLAGGED',
          8,
          'He was not proud; he was simply unaware.',
          'वह अभिमानी नहीं था, वह बस लापरवाह था।',
          '"unaware" became "careless", which is a sharper accusation.',
        ),
        f(
          'naturalPhrasing',
          'FLAGGED',
          15,
          'The question he asked was a small one.',
          'जो प्रश्न उसने पूछा वह छोटा था।',
          'Stiff; Hindi would front the question more simply.',
        ),
        f(
          'termConsistency',
          'FLAGGED',
          22,
          'body-consciousness still remained',
          'देहभाव अब भी शेष था',
          'Earlier articles used "dehbhav" transliterated; be consistent.',
          'dehbhav',
        ),
        f(
          'voiceConviction',
          'UNSURE',
          29,
          'And that was enough.',
          'और वही पर्याप्त था।',
          'Reads a little flat, but acceptable.',
        ),
      ],
    },
    {
      title: 'Demo — The Guru Does Not Hurry',
      date: '2026-02-14',
      language: 'Hindi',
      status: 'FLAGGED',
      isDemo: true,
      createdAt: now,
      flags: [
        f(
          'naturalPhrasing',
          'FLAGGED',
          7,
          'He waited without waiting for anything.',
          'वह बिना किसी चीज़ की प्रतीक्षा किए प्रतीक्षा करता रहा।',
          'The repetition works in English but clunks in Hindi.',
        ),
        f(
          'termConsistency',
          'FLAGGED',
          18,
          'the Vachanamrut of Gadhada',
          'गढडा के वचनामृत',
          'Place name spelling differs from the earlier article.',
          'Vachanamrut',
        ),
        f(
          'voiceConviction',
          'FLAGGED',
          24,
          'Do not ask again. Simply begin.',
          'पुनः पूछने की आवश्यकता नहीं है, आरंभ किया जा सकता है।',
          'Two short commands became one long formal sentence.',
        ),
      ],
    },
    {
      title: 'Demo — Counting the Beads',
      date: '2026-04-09',
      language: 'Hindi',
      status: 'FLAGGED',
      isDemo: true,
      createdAt: now,
      flags: [
        f(
          'naturalPhrasing',
          'FLAGGED',
          12,
          'It is in the smallest act that the whole of it shows.',
          'यह सबसे छोटे कार्य में है कि इसका पूरा दिखता है।',
          'A word-for-word English cleft; rewrite from memory.',
        ),
        f(
          'meaningDrift',
          'UNSURE',
          20,
          'He did it for no reason at all.',
          'उसने बिना किसी कारण के ऐसा किया।',
          'Close enough, though the English carries a touch of joy.',
        ),
      ],
    },
    {
      title: 'Demo — The Flame That Steadied',
      date: '2026-06-21',
      language: 'Hindi',
      status: 'CLEAN',
      isDemo: true,
      createdAt: now,
      flags: [],
    },
  ]

  return reports
}
