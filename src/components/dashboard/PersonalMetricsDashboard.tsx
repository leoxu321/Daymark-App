import { useMemo } from 'react'
import { TrendingUp, Calendar, Dumbbell, Briefcase, Activity, AlertTriangle, Lightbulb, Battery, BatteryLow, BatteryWarning } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useJobStore } from '@/store/jobStore'
import { useFitnessStore } from '@/store/fitnessStore'
import { useSettingsStore } from '@/store/settingsStore'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Burnout risk levels
type BurnoutLevel = 'low' | 'moderate' | 'high'

interface BurnoutPrediction {
  level: BurnoutLevel
  score: number // 0-100
  factors: string[]
  predictedBurnoutDays: string[] // Dates likely to experience burnout
}

interface GoalSuggestion {
  type: 'jobs' | 'fitness' | 'rest'
  message: string
  suggestedValue?: number
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          <TrendingUp
            className={cn(
              'h-4 w-4',
              trend === 'up' && 'text-green-500',
              trend === 'down' && 'text-red-500 rotate-180',
              trend === 'neutral' && 'text-muted-foreground'
            )}
          />
        )}
      </div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  )
}

function ProductivityBar({ day, score, isToday, isBurnoutRisk }: { day: string; score: number; isToday: boolean; isBurnoutRisk: boolean }) {
  const height = Math.max(score * 100, 5) // Min 5% height for visibility

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-16 bg-muted rounded-t flex items-end relative">
        {isBurnoutRisk && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
          </div>
        )}
        <div
          className={cn(
            'w-full rounded-t transition-all',
            isToday ? 'bg-primary' : 'bg-primary/60',
            score === 1 && 'bg-green-500',
            isBurnoutRisk && 'bg-orange-400'
          )}
          style={{ height: `${height}%` }}
        />
      </div>
      <span className={cn('text-[10px]', isToday ? 'font-bold' : 'text-muted-foreground')}>
        {day}
      </span>
    </div>
  )
}

function BurnoutIndicator({ prediction }: { prediction: BurnoutPrediction }) {
  const getBatteryIcon = () => {
    if (prediction.level === 'high') return BatteryLow
    if (prediction.level === 'moderate') return BatteryWarning
    return Battery
  }

  const BatteryIcon = getBatteryIcon()

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      prediction.level === 'high' && 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
      prediction.level === 'moderate' && 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900',
      prediction.level === 'low' && 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
    )}>
      <div className="flex items-center gap-2 mb-1">
        <BatteryIcon className={cn(
          'h-4 w-4',
          prediction.level === 'high' && 'text-red-600 dark:text-red-400',
          prediction.level === 'moderate' && 'text-orange-600 dark:text-orange-400',
          prediction.level === 'low' && 'text-green-600 dark:text-green-400'
        )} />
        <span className={cn(
          'text-sm font-medium',
          prediction.level === 'high' && 'text-red-800 dark:text-red-300',
          prediction.level === 'moderate' && 'text-orange-800 dark:text-orange-300',
          prediction.level === 'low' && 'text-green-800 dark:text-green-300'
        )}>
          {prediction.level === 'high' && 'High Burnout Risk'}
          {prediction.level === 'moderate' && 'Moderate Burnout Risk'}
          {prediction.level === 'low' && 'Energy Levels Good'}
        </span>
      </div>
      {prediction.factors.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5 ml-6">
          {prediction.factors.slice(0, 2).map((factor, i) => (
            <li key={i}>{factor}</li>
          ))}
        </ul>
      )}
      {prediction.predictedBurnoutDays.length > 0 && (
        <p className="text-xs mt-1.5 ml-6 text-orange-700 dark:text-orange-400">
          Watch out for: {prediction.predictedBurnoutDays.join(', ')}
        </p>
      )}
    </div>
  )
}

function GoalSuggestions({ suggestions }: { suggestions: GoalSuggestion[] }) {
  if (suggestions.length === 0) return null

  return (
    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
          Smart Suggestions
        </span>
      </div>
      <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 ml-6">
        {suggestions.map((suggestion, i) => (
          <li key={i}>{suggestion.message}</li>
        ))}
      </ul>
    </div>
  )
}

export function PersonalMetricsDashboard() {
  const { applications, dailyAssignments } = useJobStore()
  const { goals, dailyProgress } = useFitnessStore()
  const { settings } = useSettingsStore()

  const metrics = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const todayDow = now.getDay()

    // Calculate date ranges
    const last7Days: string[] = []
    const last14Days: string[] = []
    const last30Days: string[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      last7Days.push(date.toISOString().split('T')[0])
    }

    for (let i = 13; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      last14Days.push(date.toISOString().split('T')[0])
    }

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      last30Days.push(date.toISOString().split('T')[0])
    }

    // Next 7 days for prediction
    const next7Days: string[] = []
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      next7Days.push(date.toISOString().split('T')[0])
    }

    // Applications this week (last 7 days)
    const appliedJobs = applications.filter(a => a.status === 'applied' && a.appliedAt)
    const applicationsThisWeek = appliedJobs.filter(a => {
      const appDate = a.appliedAt!.split('T')[0]
      return last7Days.includes(appDate)
    }).length

    // Applications last week (previous 7 days)
    const previousWeek: string[] = []
    for (let i = 13; i >= 7; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      previousWeek.push(date.toISOString().split('T')[0])
    }
    const applicationsLastWeek = appliedJobs.filter(a => {
      const appDate = a.appliedAt!.split('T')[0]
      return previousWeek.includes(appDate)
    }).length

    const applicationsTrend: 'up' | 'down' | 'neutral' = applicationsThisWeek > applicationsLastWeek ? 'up'
      : applicationsThisWeek < applicationsLastWeek ? 'down' : 'neutral'

    // Fitness consistency % (last 30 days)
    let fitnessCompletedDays = 0
    let fitnessTotalDays = 0

    for (const date of last30Days) {
      const progress = dailyProgress[date]
      if (progress && progress.exercises.length > 0) {
        fitnessTotalDays++
        const completedCount = progress.exercises.filter(e => e.completed).length
        if (completedCount === goals.length && goals.length > 0) {
          fitnessCompletedDays++
        }
      }
    }

    const fitnessConsistency = fitnessTotalDays > 0
      ? Math.round((fitnessCompletedDays / fitnessTotalDays) * 100)
      : 0

    // Rolling 7-day average (applications + fitness completion rate)
    let totalProductivity = 0
    const dailyScores: { day: string; score: number; date: string }[] = []
    const recentScores: number[] = []

    for (let i = 0; i < 7; i++) {
      const date = last7Days[i]
      const dayDate = new Date(date)
      const dayName = DAY_NAMES[dayDate.getDay()]

      let dayScore = 0
      let metricsCount = 0

      // Job application score for this day
      const assignment = dailyAssignments[date]
      if (assignment) {
        const completedJobs = assignment.completedJobIds.length
        const totalJobs = assignment.jobIds.length - assignment.skippedJobIds.length
        if (totalJobs > 0) {
          dayScore += completedJobs / totalJobs
          metricsCount++
        }
      }

      // Fitness score for this day
      const fitnessProgress = dailyProgress[date]
      if (fitnessProgress && goals.length > 0) {
        const completedExercises = fitnessProgress.exercises.filter(e => e.completed).length
        dayScore += completedExercises / goals.length
        metricsCount++
      }

      const avgScore = metricsCount > 0 ? dayScore / metricsCount : 0
      totalProductivity += avgScore
      dailyScores.push({ day: dayName, score: avgScore, date })
      recentScores.push(avgScore)
    }

    const rolling7DayAvg = Math.round((totalProductivity / 7) * 100)

    // ========== BURNOUT PREDICTION ML ==========
    // Features for burnout prediction:
    // 1. Consecutive high-intensity days (>80% productivity for 5+ days)
    // 2. Declining trend in last 3 days
    // 3. Missed rest days (0 days with <50% activity in last 7 days)
    // 4. Overachievement followed by underachievement pattern
    // 5. Day of week patterns (historically low days)

    const burnoutFactors: string[] = []
    let burnoutScore = 0

    // Factor 1: Consecutive high-intensity days
    let consecutiveHighDays = 0
    for (const score of recentScores) {
      if (score >= 0.8) consecutiveHighDays++
      else consecutiveHighDays = 0
    }
    if (consecutiveHighDays >= 5) {
      burnoutScore += 25
      burnoutFactors.push(`${consecutiveHighDays} consecutive high-intensity days`)
    } else if (consecutiveHighDays >= 3) {
      burnoutScore += 10
    }

    // Factor 2: Declining trend in last 3 days
    if (recentScores.length >= 3) {
      const last3 = recentScores.slice(-3)
      if (last3[0] > last3[1] && last3[1] > last3[2] && last3[0] - last3[2] > 0.3) {
        burnoutScore += 20
        burnoutFactors.push('Declining productivity trend detected')
      }
    }

    // Factor 3: No rest days
    const restDays = recentScores.filter(s => s < 0.3).length
    if (restDays === 0 && recentScores.some(s => s > 0)) {
      burnoutScore += 15
      burnoutFactors.push('No rest days in the past week')
    }

    // Factor 4: High variance (overwork then crash pattern)
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - avgRecent, 2), 0) / recentScores.length
    if (variance > 0.15) {
      burnoutScore += 15
      burnoutFactors.push('Inconsistent activity patterns')
    }

    // Factor 5: Day of week analysis for predictions
    const dayOfWeekStats: Record<number, { total: number; count: number }> = {}
    for (let i = 0; i < 7; i++) {
      dayOfWeekStats[i] = { total: 0, count: 0 }
    }

    for (const date of last30Days) {
      const dateObj = new Date(date)
      const dow = dateObj.getDay()

      let dayScore = 0
      let hasData = false

      const assignment = dailyAssignments[date]
      if (assignment && assignment.jobIds.length > 0) {
        const completed = assignment.completedJobIds.length
        const total = assignment.jobIds.length - assignment.skippedJobIds.length
        if (total > 0) {
          dayScore += completed / total
          hasData = true
        }
      }

      const fitnessProgress = dailyProgress[date]
      if (fitnessProgress && goals.length > 0) {
        const completed = fitnessProgress.exercises.filter(e => e.completed).length
        dayScore += completed / goals.length
        hasData = true
      }

      if (hasData) {
        dayOfWeekStats[dow].total += dayScore
        dayOfWeekStats[dow].count++
      }
    }

    // Calculate day averages for predictions
    const dayAverages = Object.entries(dayOfWeekStats)
      .map(([dow, stats]) => ({
        dow: parseInt(dow),
        day: DAY_NAMES[parseInt(dow)],
        avg: stats.count > 0 ? stats.total / stats.count : 0.5
      }))
      .sort((a, b) => b.avg - a.avg)

    // Find worst days (historically low productivity)
    const worstDays = dayAverages.filter(d => d.avg < 0.4 && dayOfWeekStats[d.dow].count > 0)

    // Predict burnout days (next 7 days that historically have low productivity + current burnout score)
    const predictedBurnoutDays: string[] = []
    if (burnoutScore >= 30) {
      for (const futureDate of next7Days) {
        const futureDow = new Date(futureDate).getDay()
        const dayAvg = dayOfWeekStats[futureDow]
        if (dayAvg.count > 0 && dayAvg.total / dayAvg.count < 0.5) {
          predictedBurnoutDays.push(FULL_DAY_NAMES[futureDow])
        }
      }
      // If no historically bad days, predict based on consecutive days
      if (predictedBurnoutDays.length === 0 && consecutiveHighDays >= 3) {
        const tomorrowDow = (todayDow + 1) % 7
        predictedBurnoutDays.push(FULL_DAY_NAMES[tomorrowDow])
      }
    }

    // Add current day risk if it's historically a bad day
    const todayHistoricalAvg = dayOfWeekStats[todayDow].count > 0
      ? dayOfWeekStats[todayDow].total / dayOfWeekStats[todayDow].count
      : 0.5
    if (todayHistoricalAvg < 0.4 && burnoutScore >= 20) {
      burnoutScore += 10
      burnoutFactors.push(`${DAY_NAMES[todayDow]} is historically a challenging day`)
    }

    const burnoutLevel: BurnoutLevel = burnoutScore >= 50 ? 'high'
      : burnoutScore >= 25 ? 'moderate'
      : 'low'

    const burnoutPrediction: BurnoutPrediction = {
      level: burnoutLevel,
      score: Math.min(burnoutScore, 100),
      factors: burnoutFactors,
      predictedBurnoutDays: [...new Set(predictedBurnoutDays)].slice(0, 2)
    }

    // ========== GOAL SUGGESTIONS ==========
    const suggestions: GoalSuggestion[] = []

    // Suggest lighter goals based on burnout level
    if (burnoutLevel === 'high') {
      if (settings.jobsPerDay > 5) {
        suggestions.push({
          type: 'jobs',
          message: `Consider reducing daily job goal from ${settings.jobsPerDay} to 5 applications`,
          suggestedValue: 5
        })
      }
      if (goals.length > 2) {
        suggestions.push({
          type: 'fitness',
          message: `Focus on ${goals.length > 3 ? '2-3' : '1-2'} key exercises instead of all ${goals.length}`,
        })
      }
      suggestions.push({
        type: 'rest',
        message: 'Schedule a recovery day this week'
      })
    } else if (burnoutLevel === 'moderate') {
      if (consecutiveHighDays >= 3) {
        suggestions.push({
          type: 'rest',
          message: 'Take a lighter day tomorrow to maintain momentum'
        })
      }
      if (fitnessConsistency < 50 && goals.length > 0) {
        suggestions.push({
          type: 'fitness',
          message: 'Start with just 1-2 exercises to build consistency'
        })
      }
    } else {
      // Low burnout - encourage optimization
      if (applicationsThisWeek < applicationsLastWeek && applicationsLastWeek > 0) {
        suggestions.push({
          type: 'jobs',
          message: 'You have capacity - consider adding a few more applications'
        })
      }
      if (worstDays.length > 0 && worstDays[0].avg < 0.3) {
        suggestions.push({
          type: 'rest',
          message: `${worstDays[0].day}s tend to be harder - plan lighter goals`
        })
      }
    }

    // Best days
    const bestDays = dayAverages
      .filter(d => d.avg > 0)
      .slice(0, 2)
      .map(d => d.day)

    return {
      applicationsThisWeek,
      applicationsTrend,
      fitnessConsistency,
      rolling7DayAvg,
      bestDays,
      dailyScores,
      today,
      burnoutPrediction,
      suggestions,
      predictedBurnoutDays: new Set(predictedBurnoutDays.map(d => {
        // Convert day name back to date for highlighting
        for (const futureDate of next7Days) {
          if (FULL_DAY_NAMES[new Date(futureDate).getDay()] === d) {
            return futureDate
          }
        }
        return ''
      }))
    }
  }, [applications, dailyAssignments, dailyProgress, goals, settings.jobsPerDay])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Personal Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Burnout Indicator */}
        <BurnoutIndicator prediction={metrics.burnoutPrediction} />

        {/* Goal Suggestions */}
        <GoalSuggestions suggestions={metrics.suggestions} />

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Applications This Week"
            value={metrics.applicationsThisWeek}
            icon={Briefcase}
            trend={metrics.applicationsTrend}
            subtitle="last 7 days"
          />
          <MetricCard
            title="Fitness Consistency"
            value={`${metrics.fitnessConsistency}%`}
            icon={Dumbbell}
            subtitle="last 30 days"
          />
          <MetricCard
            title="7-Day Productivity"
            value={`${metrics.rolling7DayAvg}%`}
            icon={TrendingUp}
            subtitle="rolling average"
          />
          <MetricCard
            title="Best Days"
            value={metrics.bestDays.length > 0 ? metrics.bestDays.join(', ') : '-'}
            icon={Calendar}
            subtitle="most productive"
          />
        </div>

        {/* Weekly Productivity Chart */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-3">Weekly Productivity</p>
          <div className="flex justify-between items-end px-2">
            {metrics.dailyScores.map(({ day, score, date }) => (
              <ProductivityBar
                key={date}
                day={day}
                score={score}
                isToday={date === metrics.today}
                isBurnoutRisk={metrics.predictedBurnoutDays.has(date)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
