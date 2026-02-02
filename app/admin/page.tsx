'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar, 
  TrendingUp, 
  Maximize2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface FeedbackRecord {
  id: number;
  satisfaction_level: string;
  created_at: string;
}

interface Stats {
  total: number;
  stats: Array<{
    level: string;
    count: number;
    percentage: string;
  }>;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showingButtons, setShowingButtons] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword('');
        loadData();
      } else {
        setLoginError('Password incorreta');
      }
    } catch (error) {
      setLoginError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (date?: string) => {
    try {
      const statsUrl = date
        ? `${API_BASE_URL}/api/admin/stats?date=${date}`
        : `${API_BASE_URL}/api/admin/stats`;
      const feedbackUrl = date
        ? `${API_BASE_URL}/api/feedback?date=${date}`
        : `${API_BASE_URL}/api/feedback`;

      const [statsRes, feedbackRes] = await Promise.all([
        fetch(statsUrl),
        fetch(feedbackUrl),
      ]);

      const statsData = await statsRes.json();
      const feedbackData = await feedbackRes.json();

      setStats(statsData);
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error('[v0] Error loading data:', error);
    }
  };

  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    loadData(date || undefined);
  };

  const handleExport = async (format: 'csv' | 'txt') => {
    try {
      const url = selectedDate 
        ? `${API_BASE_URL}/api/admin/export?format=${format}&date=${selectedDate}`
        : `${API_BASE_URL}/api/admin/export?format=${format}`;
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('[v0] Error exporting:', error);
    }
  };

  const handleShowButtons = () => {
    window.open('/kiosk', '_blank');
  };

  const getColorForLevel = (level: string) => {
    switch (level) {
      case 'Muito Satisfeito':
        return 'bg-emerald-500';
      case 'Satisfeito':
        return 'bg-amber-500';
      case 'Insatisfeito':
        return 'bg-rose-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Lock className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-white">Admin Dashboard</CardTitle>
            <p className="text-center text-slate-400">Digite a password para aceder</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a password"
                    className="bg-slate-700/50 border-slate-600 text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && (
                <p className="text-rose-400 text-sm text-center">{loginError}</p>
              )}
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? 'A entrar...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="fixed bottom-4 right-4 text-xs text-slate-400">
          Password de desenvolvimento -&gt; pedrosa
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Dashboard de Satisfação</h1>
            <p className="text-slate-600 mt-1">Análise e estatísticas de feedback</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleShowButtons}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Exibir Botões
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('txt')}>
                  Exportar TXT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Date Filter */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <Label htmlFor="dateFilter" className="text-slate-700 mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Filtrar por Data
                </Label>
                <Input
                  id="dateFilter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateFilter(e.target.value)}
                  className="bg-slate-50 border-slate-300"
                />
              </div>
              <Button
                onClick={() => handleDateFilter(new Date().toISOString().split('T')[0])}
                variant="outline"
                className="bg-white"
              >
                Hoje
              </Button>
              {selectedDate && (
                <Button
                  onClick={() => handleDateFilter('')}
                  variant="outline"
                  className="bg-white"
                >
                  Limpar Filtro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          {stats?.stats.map((stat) => (
            <Card key={stat.level} className="bg-white border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.level}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{stat.count}</div>
                <p className="text-sm text-slate-500 mt-1">{stat.percentage}% do total</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <BarChart3 className="w-5 h-5 mr-2" />
                Distribuição por Nível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.stats.map((stat) => (
                  <div key={stat.level} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{stat.level}</span>
                      <span className="text-slate-600">{stat.count} ({stat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${getColorForLevel(stat.level)} transition-all duration-500`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart Visualization */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <PieChart className="w-5 h-5 mr-2" />
                Percentagens Relativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="grid grid-cols-1 gap-4 w-full">
                  {stats?.stats.map((stat) => (
                    <div key={stat.level} className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg ${getColorForLevel(stat.level)} flex items-center justify-center text-white font-bold text-lg`}>
                        {stat.percentage}%
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{stat.level}</p>
                        <p className="text-sm text-slate-600">{stat.count} avaliações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback History Table */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <TrendingUp className="w-5 h-5 mr-2" />
              Histórico de Feedbacks ({feedbacks.length} registos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Nível de Satisfação</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.slice(0, 50).map((feedback) => {
                    const date = new Date(feedback.created_at);
                    return (
                      <tr key={feedback.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-600">{feedback.id}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium text-white ${getColorForLevel(feedback.satisfaction_level)}`}>
                            {feedback.satisfaction_level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {date.toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {date.toLocaleTimeString('pt-BR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {feedbacks.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  Nenhum feedback registado ainda
                </div>
              )}
              {feedbacks.length > 50 && (
                <div className="text-center py-4 text-sm text-slate-600">
                  Mostrando 50 de {feedbacks.length} registos
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
