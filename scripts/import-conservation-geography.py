"""Import sanitized questions and official keys captured from the current course UI."""
import itertools
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'sources/conservation-geography'
TOPICS = ['Practice assignment', 'Introduction to conservation geography', 'The Earth',
          'Lithosphere & landforms', 'Atmosphere', 'Hydrosphere',
          'Physical geography of India', 'Biosphere', 'Conservation of biodiversity',
          'Human population & conservation', 'Resources & conservation',
          'Economic geography & conservation', 'Remote sensing, disasters & valuation']


def build():
    weeks = []
    for number, topic in enumerate(TOPICS):
        path = SOURCES / f'week-{number:02}.source.json'
        source = json.loads(path.read_text())
        assert source['week'] == number
        assert len(source['questions']) == 10
        questions = []
        for index, item in enumerate(source['questions'], 1):
            assert item['number'] == index
            options = [{'id': chr(65 + i), 'text': text} for i, text in enumerate(item['options'])]
            answer = item['acceptedAnswer']
            correct = None
            if answer is not None:
                matches = [[o['id'] for o in combo]
                           for size in range(1, len(options) + 1)
                           for combo in itertools.combinations(options, size)
                           if ', '.join(o['text'] for o in combo) == answer]
                assert len(matches) == 1, (number, index, answer, options)
                correct = matches[0]
            assert item['prompt'].strip() and all(o['text'].strip() for o in options)
            questions.append(dict(id=f'w{number:02}-q{index:02}', number=index, sourceNumber=index,
                                  type=item['type'], prompt=item['prompt'], options=options,
                                  correctOptionIds=correct, answerStatus='official' if correct else 'unavailable',
                                  answerSource='course-accepted-answer' if correct else None,
                                  sourceAnswerText=answer, reference=None, note=None))
        weeks.append(dict(week=number, title=f'Week {number}', topic=topic, sourceUrl=source['url'],
                          sourceFile=str(path.relative_to(ROOT)), answersVerifiedOn=source['collectedOn'],
                          sourceNote='Official accepted answers copied from the current assignment page; any unavailable keys remain unset.',
                          questions=questions))
    return dict(course='Conservation Geography', courseId='noc26_ge82', collectedOn='2026-10-22',
                schemaVersion=3, weeks=weeks)


if __name__ == '__main__':
    data = build()
    (ROOT / 'data/conservation-geography.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Imported {sum(len(w['questions']) for w in data['weeks'])} questions")
