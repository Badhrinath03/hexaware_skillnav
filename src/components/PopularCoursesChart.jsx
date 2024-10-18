// PieChart.jsx
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement);

const PopularCoursesChart = ({ courses }) => {
  if (!Array.isArray(courses) || courses.length === 0) {
    return <div>No data available</div>;
  }

  // Extract and sort data
  const labels = courses.map(course => course.name);
  const dataValues = courses.map(course => course.completions);

  // Define the data object for the Pie chart
  const data = {
    labels,
    datasets: [
      {
        label: 'Popular Courses',
        data: dataValues,
        backgroundColor: [
          '#FF6384', 
          '#36A2EB', 
          '#FFCE56',
          '#4BC0C0', 
          '#9966FF', 
          '#FF9F40' 
        ],
        borderColor: ['#fff'],
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
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.raw} completions`;
          },
        },
      },
    },
  };

  return (
    <div className="relative h-80">
      <Pie data={data} options={options} />
    </div>
  );
};

export default PopularCoursesChart;
