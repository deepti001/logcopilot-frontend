// /src/components/ExceptionsChart.tsx

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface ExceptionsChartProps {
  chartData: any[];
  groupBy: "exception-type" | "service-pod";
}

export function ExceptionsChart({ chartData, groupBy }: ExceptionsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value}
        />
        <YAxis />
        <RechartsTooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <p className="font-medium">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                      {entry.dataKey}: {entry.value}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
        {groupBy === "exception-type" ? (
          <>
            <Area type="monotone" dataKey="OutOfMemoryError" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            <Area type="monotone" dataKey="NullPointerException" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
            <Area type="monotone" dataKey="ConnectionTimeout" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
            <Area type="monotone" dataKey="RateLimitExceeded" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
          </>
        ) : (
          <>
            <Area type="monotone" dataKey="user-service" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="auth-service" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            <Area type="monotone" dataKey="payment-service" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
            <Area type="monotone" dataKey="order-service" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
          </>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}