import { useMemo, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useApplicationAutomationStore } from '@/store/applicationAutomationStore'
import type {
  AnswerCategory,
  AnswerInputType,
  ApplicationProfile,
  EducationEntry,
} from '@/types'

type ProfileTextField = Exclude<
  keyof ApplicationProfile,
  'educationEntries' | 'educationSummary' | 'resumeFileName' | 'resumeUpdatedAt'
>

const PROFILE_FIELDS: Array<{
  key: ProfileTextField
  label: string
  type?: string
}> = [
  { key: 'fullName', label: 'Full name' },
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'location', label: 'Location' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'desiredRole', label: 'Desired role' },
  { key: 'yearsExperience', label: 'Years experience' },
  { key: 'workAuthorization', label: 'Work authorization' },
  { key: 'needsSponsorship', label: 'Sponsorship' },
  { key: 'availableStartDate', label: 'Available start date', type: 'date' },
]

const DEGREE_LEVELS = [
  '',
  "Bachelor's",
  "Master's",
  'Doctorate',
  'Associate',
  'Certificate',
  'High School',
  'Other',
]

const ANSWER_INPUT_TYPES: Array<{ value: AnswerInputType; label: string }> = [
  { value: 'textarea', label: 'Long text' },
  { value: 'text', label: 'Short text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multi_select', label: 'Multi-select' },
]

const ANSWER_CATEGORIES: Array<{ value: AnswerCategory; label: string }> = [
  { value: 'work_authorization', label: 'Work authorization' },
  { value: 'experience', label: 'Experience' },
  { value: 'availability', label: 'Availability' },
  { value: 'location', label: 'Location' },
  { value: 'demographics', label: 'Demographics' },
  { value: 'general', label: 'General' },
]

export function ApplicationAutomation() {
  const {
    applicationProfile,
    savedAnswers,
    attempts,
    activeAttemptId,
    updateApplicationProfile,
    addEducationEntry,
    updateEducationEntry,
    removeEducationEntry,
    upsertSavedAnswer,
    removeSavedAnswer,
  } = useApplicationAutomationStore()

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState<AnswerCategory>('general')
  const [inputType, setInputType] = useState<AnswerInputType>('textarea')
  const [optionsText, setOptionsText] = useState('')

  const activeAttempt = useMemo(
    () => attempts.find((attempt) => attempt.id === activeAttemptId) || attempts[0],
    [activeAttemptId, attempts]
  )

  const answerOptions = useMemo(
    () =>
      optionsText
        .split(/\r?\n|,/)
        .map((option) => option.trim())
        .filter(Boolean),
    [optionsText]
  )

  const selectedMultiAnswers = useMemo(
    () =>
      answer
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    [answer]
  )

  const completedProfileFields =
    PROFILE_FIELDS.filter(({ key }) => String(applicationProfile[key] || '').trim()).length +
    (applicationProfile.educationEntries || []).filter((entry) =>
      [entry.degreeLevel, entry.school, entry.degree, entry.fieldOfStudy].some((value) =>
        value.trim()
      )
    ).length

  const handleSaveAnswer = () => {
    upsertSavedAnswer(question, answer, category, inputType, answerOptions)
    setQuestion('')
    setAnswer('')
    setCategory('general')
    setInputType('textarea')
    setOptionsText('')
  }

  const toggleMultiAnswer = (option: string) => {
    const nextAnswers = selectedMultiAnswers.includes(option)
      ? selectedMultiAnswers.filter((value) => value !== option)
      : [...selectedMultiAnswers, option]

    setAnswer(nextAnswers.join(', '))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Application Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm font-medium">Profile fields</span>
              <Badge variant="secondary">
                {completedProfileFields}/{PROFILE_FIELDS.length + 1}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {PROFILE_FIELDS.map(({ key, label, type = 'text' }) => (
                <label key={key} className="space-y-1 text-sm">
                  <span className="font-medium">{label}</span>
                  <Input
                    type={type}
                    value={String(applicationProfile[key] || '')}
                    onChange={(event) =>
                      updateApplicationProfile({ [key]: event.target.value })
                    }
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addEducationEntry}>
                <Plus className="h-4 w-4" />
                Add Degree
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(applicationProfile.educationEntries || []).length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Add your bachelor's, master's, and any other education here.
                </p>
                <Button className="mt-3" size="sm" onClick={addEducationEntry}>
                  <Plus className="h-4 w-4" />
                  Add First Degree
                </Button>
              </div>
            ) : (
              (applicationProfile.educationEntries || []).map((entry, index) => (
                <EducationEntryEditor
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onChange={(updates) => updateEducationEntry(entry.id, updates)}
                  onRemove={() => removeEducationEntry(entry.id)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Saved Answers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Question</span>
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Are you legally authorized to work in the United States?"
                />
              </label>

              {inputType === 'text' && (
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Answer</span>
                  <Input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                  />
                </label>
              )}

              {inputType === 'textarea' && (
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Answer</span>
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="space-y-1 text-sm sm:w-64">
                  <span className="font-medium">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as AnswerCategory)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {ANSWER_CATEGORIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm sm:w-48">
                  <span className="font-medium">Answer type</span>
                  <select
                    value={inputType}
                    onChange={(event) => {
                      setInputType(event.target.value as AnswerInputType)
                      setAnswer('')
                    }}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {ANSWER_INPUT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end">
                  <Button onClick={handleSaveAnswer} disabled={!question.trim() || !answer.trim()}>
                    <CheckCircle2 className="h-4 w-4" />
                    Save Answer
                  </Button>
                </div>
                </div>
              </div>

              {(inputType === 'select' || inputType === 'multi_select') && (
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Dropdown choices</span>
                  <textarea
                    value={optionsText}
                    onChange={(event) => {
                      setOptionsText(event.target.value)
                      setAnswer('')
                    }}
                    placeholder="Yes&#10;No&#10;Prefer not to answer"
                    className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </label>
              )}

              {inputType === 'select' && answerOptions.length > 0 && (
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Selected answer</span>
                  <select
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Choose an answer</option>
                    {answerOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {inputType === 'multi_select' && answerOptions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Selected answers</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {answerOptions.map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMultiAnswers.includes(option)}
                          onChange={() => toggleMultiAnswer(option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
              {savedAnswers.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No saved answers yet.
                </p>
              ) : (
                savedAnswers.map((savedAnswer) => (
                  <div
                    key={savedAnswer.id}
                    className="rounded-md border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{savedAnswer.question}</p>
                          <Badge variant="outline" className="text-xs">
                            {ANSWER_CATEGORIES.find((item) => item.value === savedAnswer.category)?.label ||
                              'General'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {ANSWER_INPUT_TYPES.find((item) => item.value === savedAnswer.inputType)?.label ||
                              'Long text'}
                          </Badge>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {savedAnswer.answer || 'Needs an answer'}
                        </p>
                        {savedAnswer.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {savedAnswer.options.map((option) => (
                              <Badge key={option} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSavedAnswer(savedAnswer.id)}
                        title="Delete answer"
                        className="h-8 w-8 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Auto Apply Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeAttempt ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Queue is empty.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{activeAttempt.company}</p>
                      <p className="text-sm text-muted-foreground">{activeAttempt.role}</p>
                    </div>
                    <Badge variant={activeAttempt.status === 'ready' ? 'default' : 'secondary'}>
                      {activeAttempt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {activeAttempt.missingProfileFields.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Profile needed</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeAttempt.missingProfileFields.map((field) => (
                        <Badge key={field} variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {activeAttempt.missingQuestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Questions needed</h4>
                    <div className="space-y-2">
                      {activeAttempt.missingQuestions.map((missingQuestion) => (
                        <button
                          key={missingQuestion}
                          type="button"
                          onClick={() => {
                            setQuestion(missingQuestion)
                            setInputType('select')
                            setOptionsText('Yes\nNo')
                          }}
                          className="w-full rounded-md border p-2 text-left text-sm hover:bg-accent"
                        >
                          {missingQuestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button asChild variant="outline" className="w-full">
                  <a
                    href={activeAttempt.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Review Application
                  </a>
                </Button>
              </div>
            )}

            {attempts.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent</h4>
                {attempts.slice(0, 6).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{attempt.company}</p>
                      <p className="truncate text-xs text-muted-foreground">{attempt.role}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {attempt.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EducationEntryEditor({
  entry,
  index,
  onChange,
  onRemove,
}: {
  entry: EducationEntry
  index: number
  onChange: (updates: Partial<EducationEntry>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-medium">Degree {index + 1}</h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          title="Remove degree"
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Degree level</span>
          <select
            value={entry.degreeLevel}
            onChange={(event) => onChange({ degreeLevel: event.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {DEGREE_LEVELS.map((level) => (
              <option key={level || 'blank'} value={level}>
                {level || 'Select level'}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">School</span>
          <Input
            value={entry.school}
            onChange={(event) => onChange({ school: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Degree</span>
          <Input
            value={entry.degree}
            placeholder="M.S., B.S., Bachelor of Science"
            onChange={(event) => onChange({ degree: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Field of study</span>
          <Input
            value={entry.fieldOfStudy}
            placeholder="Computer Science"
            onChange={(event) => onChange({ fieldOfStudy: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Start date</span>
          <Input
            value={entry.startDate}
            placeholder="Aug 2022"
            onChange={(event) => onChange({ startDate: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">End date</span>
          <Input
            value={entry.endDate}
            placeholder="May 2026"
            onChange={(event) => onChange({ endDate: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">GPA</span>
          <Input
            value={entry.gpa}
            onChange={(event) => onChange({ gpa: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Location</span>
          <Input
            value={entry.location}
            onChange={(event) => onChange({ location: event.target.value })}
          />
        </label>
      </div>
    </div>
  )
}
