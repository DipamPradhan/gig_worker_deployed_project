import React, { useState, useEffect, useCallback } from "react";

import { servicesService } from "../../api";
import { useApi } from "../../hooks";

import { Chart as ChartJS } from "chart.js/auto";
import { Doughnut } from "react-chartjs-2";

const WorkChart = () => {
  const { loading, error, execute } = useApi();
  const [requests, setRequests] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await execute(() => servicesService.getRequests());
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoaded(true);
    }
  }, [execute]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (loading && !isLoaded) {
    return <div className="text-sm text-gray-600">Loading request analytics…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">Failed to load request analytics.</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        No requests found to display.
      </div>
    );
  }

  const categoryCounts = requests.reduce((acc, request) => {
    const category =
      request.category_name || request.category || request.service_category ||
      "Unknown Category";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(categoryCounts);
  const dataValues = Object.values(categoryCounts);

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed || 0;
            const total = dataValues.reduce((sum, count) => sum + count, 0);
            const percent = total ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${context.label}: ${value} (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-[350px]">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              label: "Requests by category",
              data: dataValues,
              backgroundColor: labels.map((_, idx) =>
                [
                  "#3b82f6",
                  "#f97316",
                  "#14b8a6",
                  "#eab308",
                  "#8b5cf6",
                  "#ec4899",
                  "#10b981",
                  "#f43f5e",
                  "#6366f1",
                  "#0ea5e9",
                ][idx % 10],
              ),
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        }}
        options={options}
      />
    </div>
  );
};

export default WorkChart;
