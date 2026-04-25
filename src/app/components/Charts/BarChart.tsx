'use client'

import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js'
import BASE_URL from '@/app/config/api/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface StatsByAgent {
  SOLVED_DAILY: number
  SOLVED_WEEKLY: number
  SOLVED_MONTHLY: number
  DAILY_TICKETS: number
  WEEKLY_TICKETS: number
  MONTHLY_TICKETS: number
}

const BarChart: React.FC = () => {
  const [stats, setStats] = useState<StatsByAgent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedToken = localStorage.getItem('email')
        if (!storedToken) {
          throw new Error('No token found')
        }

        const response = await fetch(`${BASE_URL}/ticket/getMyStats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: storedToken,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: StatsByAgent = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return <p>Error: {error}</p>
  }

  if (!stats) {
    return <p>Loading chart...</p>
  }

  const data: ChartData<'bar'> = {
    labels: ['Daily', 'Weekly', 'Monthly'],
    datasets: [
      {
        label: 'Solved Tickets',
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        data: [stats.SOLVED_DAILY, stats.SOLVED_WEEKLY, stats.SOLVED_MONTHLY],
      },
      {
        label: 'Total Tickets',
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        data: [stats.DAILY_TICKETS, stats.WEEKLY_TICKETS, stats.MONTHLY_TICKETS],
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Agent Support Ticket Stats',
      },
      legend: {
        position: 'top' as const,
      },
    },
  }

  return <Bar data={data} options={options} />
}

export default BarChart
