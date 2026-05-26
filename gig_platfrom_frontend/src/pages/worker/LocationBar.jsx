import React,{useState, useEffect} from 'react'

import { servicesService } from "../../api";
import { useApi } from "../../hooks";

import {Chart as ChartJS} from 'chart.js/auto'
import { Bar } from 'react-chartjs-2'


const LocationBar = () => {
  const { loading, error, execute, clearError } = useApi();
  const [jobs, setJobs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await execute(() => servicesService.getAssignedRequests());
      const jobList = Array.isArray(data) ? data : data.results || [];
      setJobs(jobList);
    //   console.log("LocationBar fetched jobs:", jobList);
    } catch (err) {
      console.log("LocationBar fetch error:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

//   useEffect(() => {
//     console.log("LocationBar jobs state updated:", jobs);
//   }, [jobs]);

  if (loading && !isLoaded) {
    return <div className="text-sm text-gray-600">Loading job analytics…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">Failed to load job analytics.</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        No assigned jobs found to display.
      </div>
    );
  }

  const getSecondPlace = (address) => {
    const normalized = (address || "").toString().trim();
    const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
    if(/\d/.test(parts[2])||/\d/.test(parts[0])){
      return `${parts[1]}`
    }
    return parts[2]||parts[0]||"Unknown Address";
  };

  const addressCounts = jobs.reduce((acc, job) => {
    const address = getSecondPlace(job.request_address || "Unknown address");
    acc[address] = (acc[address] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(addressCounts);
  const dataValues = Object.values(addressCounts);
  const options = {
  maintainAspectRatio: false,

  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        autoSkip: false,
      },
    },
  },

  layout: {
    padding: {
      left: 20,
      right: 20,
    },
  },
};
  return (
    <div className="w-full h-[350px]">
      <Bar
        data={{
        
          labels,
          datasets: [
            {
              label: "Location v/s number of jobs ",
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
                ][idx % 8],
              ),
              barThickness: 45,        
              maxBarThickness: 60,            
            },
          ],
        }}
        options={options}
      />
    </div>
  );
}

export default LocationBar
