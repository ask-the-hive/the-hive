'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useChain } from '@/app/_contexts/chain-context'

interface ProjectionData {
  baseNetWorth: number
  historical: Array<{
    date: string
    netWorth: number
  }>
  projection: Array<{
    date: string
    netWorth: number
  }>
}

interface Props {
  address: string
}

const PortfolioProjection: React.FC<Props> = ({ address }) => {
  const { currentChain } = useChain()
  const [data, setData] = useState<ProjectionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  const fetchProjectionData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/portfolio/projection?wallet=${address}&days=${days}&chain=${currentChain}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching portfolio projection:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch projection data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchProjectionData()
    }
  }, [address, days, currentChain])

  // Combine historical and projection data for the chart with APY overlay
  const chartData = React.useMemo(() => {
    if (!data) return []
    
    // Calculate APY from historical data
    const calculateAPY = () => {
      if (data.historical.length < 2) return 0
      
      const firstValue = data.historical[0].netWorth
      const lastValue = data.historical[data.historical.length - 1].netWorth
      const days = data.historical.length
      
      if (firstValue === 0) return 0
      
      const totalReturn = (lastValue - firstValue) / firstValue
      const dailyReturn = Math.pow(1 + totalReturn, 1 / days) - 1
      const annualizedReturn = Math.pow(1 + dailyReturn, 365) - 1
      
      return annualizedReturn * 100 // Convert to percentage
    }
    
    const apy = calculateAPY()
    const startDate = data.historical[0]?.date ? new Date(data.historical[0].date) : new Date()
    
    const combined = [
      ...data.historical.map(item => ({
        ...item,
        type: 'Historical',
        date: new Date(item.date).toLocaleDateString(),
        apyValue: item.netWorth
      })),
      ...data.projection.map(item => {
        const daysFromStart = (new Date(item.date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        const apyValue = data.baseNetWorth * Math.pow(1 + apy / 100, daysFromStart / 365)
        
        return {
          ...item,
          type: 'Projection',
          date: new Date(item.date).toLocaleDateString(),
          apyValue
        }
      })
    ]
    
    return combined
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'netWorth' ? 'Net Worth' : 
               entry.dataKey === 'apyValue' ? 'APY Overlay' : 
               entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Portfolio Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Portfolio Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchProjectionData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.baseNetWorth === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Portfolio Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No portfolio data available for projection</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentValue = data.baseNetWorth
  const projectedValue = data.projection[data.projection.length - 1]?.netWorth || currentValue
  const totalGain = projectedValue - currentValue
  const percentageGain = ((totalGain / currentValue) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Portfolio Projection
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Current Value</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(currentValue)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Projected Value</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(projectedValue)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Projected Gain</span>
              </div>
              <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
              </p>
              <p className={`text-sm ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({totalGain >= 0 ? '+' : ''}{percentageGain.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                  name="Net Worth"
                />
                <Line 
                  type="monotone" 
                  dataKey="apyValue" 
                  stroke="#ff6b6b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="APY Overlay"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Historical & Projected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" style={{ background: 'repeating-linear-gradient(90deg, #ff6b6b 0px, #ff6b6b 3px, transparent 3px, transparent 6px)' }}></div>
              <span>APY Overlay</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioProjection
