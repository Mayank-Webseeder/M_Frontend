import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, ArrowUpRight, ArrowDownRight, PieChart, BarChart, Plus } from 'lucide-react';

const Financial = () => {
  const financialStats = [
    {
      title: 'Total Revenue',
      value: '$125,000',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign
    },
    {
      title: 'Monthly Revenue',
      value: '$45,000',
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp
    },
    {
      title: 'Expenses',
      value: '$28,500',
      change: '-3.1%',
      trend: 'down',
      icon: TrendingDown
    },
    {
      title: 'Pending Payments',
      value: '$15,200',
      change: '+5.4%',
      trend: 'up',
      icon: CreditCard
    }
  ];

  const recentTransactions = [
    {
      id: 1,
      description: 'Banner Design Project',
      amount: 2500,
      type: 'credit',
      date: '2024-03-15',
      status: 'Completed'
    },
    {
      id: 2,
      description: 'Office Supplies',
      amount: 350,
      type: 'debit',
      date: '2024-03-14',
      status: 'Pending'
    },
    {
      id: 3,
      description: 'Logo Design Package',
      amount: 1800,
      type: 'credit',
      date: '2024-03-13',
      status: 'Completed'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financial Overview</h1>
          <p className="mt-1 text-sm text-gray-500">Track your financial performance and metrics</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center hover:bg-gray-50">
            <PieChart className="h-5 w-5 mr-2" />
            View Reports
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            Generate Statement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {financialStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${
                stat.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <stat.icon className={`h-6 w-6 ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              {stat.trend === 'up' ? (
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className={`ml-2 text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
            <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <TrendingUp className={`h-5 w-5 ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}${transaction.amount}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.status === 'Completed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Payment Methods</h2>
            <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
              Manage
            </button>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-gray-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Credit Card</p>
                  <p className="text-sm text-gray-500">**** **** **** 4242</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                Primary
              </span>
            </div>
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="h-6 w-6 text-gray-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Bank Account</p>
                  <p className="text-sm text-gray-500">**** 5678</p>
                </div>
              </div>
              <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                Set as Primary
              </button>
            </div>
          </div>
          <button className="mt-4 w-full bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center justify-center hover:bg-gray-100">
            <Plus className="h-5 w-5 mr-2" />
            Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );
};

export default Financial;