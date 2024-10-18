import React, { useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UsersGrowthChart = ({ users }) => {
  const chartRef = useRef(null);

  const registrationCounts = users.reduce((acc, user) => {
    const date = new Date(user.registrationDate).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(registrationCounts);
  const data = Object.values(registrationCounts);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Users Registered',
        data,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }
          const gradient = ctx.createLinearGradient(
            chartArea.left,
            chartArea.top,
            chartArea.right,
            chartArea.bottom
          );
          gradient.addColorStop(0, 'rgba(138, 43, 226, 0.6)'); // Violet
          gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.6)'); // Orange
          gradient.addColorStop(1, 'rgba(75, 0, 130, 0.6)'); // Indigo
          return gradient;
        },
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Registrations Per Day',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Number of Users',
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
        },
      },
    },
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const animateGradient = () => {
        const { ctx, chartArea } = chart;
        if (!chartArea) {
          return;
        }
        const gradient = ctx.createLinearGradient(
          chartArea.left,
          chartArea.top,
          chartArea.right,
          chartArea.bottom
        );
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0.6)');
        chart.data.datasets[0].backgroundColor = gradient;
        chart.update();
      };
      animateGradient();
      const interval = setInterval(animateGradient, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="relative overflow-hidden">
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default UsersGrowthChart;
