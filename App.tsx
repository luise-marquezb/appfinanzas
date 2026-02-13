
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from './types';
import { extractReceiptData } from './services/geminiService';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [showSuccess, setShowSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // API URL
  const API_URL = 'http://localhost/gastosapp/api.php';

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error fetching data');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: TransactionType.EXPENSE,
    category: 'Comida',
    date: new Date().toISOString().slice(0, 10)
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(filterMonth));
  }, [transactions, filterMonth]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    return [
      { name: 'Ingresos', valor: summary.income, color: '#10b981' },
      { name: 'Egresos', valor: summary.expense, color: '#f43f5e' }
    ];
  }, [summary]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTransaction = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });

      if (response.ok) {
        await fetchTransactions(); // Reload data
        setFormData({
          description: '',
          amount: '',
          type: TransactionType.EXPENSE,
          category: 'Comida',
          date: new Date().toISOString().slice(0, 10)
        });
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert("Error al guardar en la base de datos");
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Error de conexión");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const data = await extractReceiptData(base64);
      
      if (data) {
        const newTransaction = {
          description: `Compra en ${data.comercio}`,
          amount: data.total,
          type: TransactionType.EXPENSE,
          category: data.categoria,
          date: new Date().toISOString().slice(0, 10)
        };
        
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTransaction)
          });

          if (response.ok) {
             await fetchTransactions();
             setShowSuccess(true);
             setTimeout(() => setShowSuccess(false), 3000);
          }
        } catch (error) {
           console.error("Error saving scanned transaction:", error);
        }
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Informe Gastoxpress - ${filterMonth}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Total Ingresos: S/. ${summary.income.toFixed(2)}`, 20, 40);
    doc.text(`Total Egresos: S/. ${summary.expense.toFixed(2)}`, 20, 50);
    doc.text(`Balance: S/. ${summary.balance.toFixed(2)}`, 20, 60);
    
    let y = 80;
    doc.text("Detalle de movimientos:", 20, y);
    y += 10;
    filteredTransactions.forEach((t, i) => {
      if (y > 280) { doc.addPage(); y = 20; }
      const line = `${t.date} - ${t.description} (${t.type}): S/. ${Number(t.amount).toFixed(2)}`;
      doc.text(line, 20, y);
      y += 8;
    });
    doc.save(`Gastoxpress_Informe_${filterMonth}.pdf`);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");
    XLSX.writeFile(workbook, `Gastoxpress_${filterMonth}.xlsx`);
  };

  const deleteTransaction = async (id: string) => {
    if (confirm("¿Seguro que quieres borrar este registro?")) {
      try {
        const response = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchTransactions();
        } else {
          alert("Error al eliminar");
        }
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <i className="fas fa-wallet text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Gastoxpress</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
            <span className="text-slate-500 text-sm font-medium">Balance Mensual</span>
            <span className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              S/. {summary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-slate-500 text-sm font-medium">Ingresos</span>
            </div>
            <span className="text-3xl font-bold text-emerald-600">
              S/. {summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
             <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-slate-500 text-sm font-medium">Egresos</span>
            </div>
            <span className="text-3xl font-bold text-rose-600">
              S/. {summary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <i className="fas fa-plus-circle text-emerald-600"></i>
                Nuevo Movimiento
              </h2>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descripción</label>
                  <input 
                    required
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Ej. Súpermercado"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monto (S/.)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                    >
                      <option value={TransactionType.INCOME}>Ingreso</option>
                      <option value={TransactionType.EXPENSE}>Egreso</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Categoría</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                    >
                      <option>Comida</option>
                      <option>Transporte</option>
                      <option>Salud</option>
                      <option>Hogar</option>
                      <option>Entretenimiento</option>
                      <option>Otros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha</label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200"
                >
                  Registrar Movimiento
                </button>
              </form>

              {showSuccess && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-center text-sm font-medium animate-bounce">
                  ¡Movimiento registrado con éxito!
                </div>
              )}
            </div>

            {/* Smart Scan */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-dashed border-2">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i className="fas fa-magic text-purple-600"></i>
                Escanear Recibo (IA)
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Sube una foto de tu ticket y Gastoxpress extraerá automáticamente el monto y la categoría usando IA.
              </p>
              <label className="block w-full cursor-pointer group">
                <div className={`flex items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all ${isScanning ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200 group-hover:border-purple-400 group-hover:bg-purple-50/30'}`}>
                  {isScanning ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                      <span className="text-sm font-medium text-purple-700">Procesando con Gemini...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <i className="fas fa-camera text-slate-400 text-2xl group-hover:text-purple-500"></i>
                      <span className="text-sm font-medium text-slate-600">Haz clic para subir imagen</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  disabled={isScanning}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          {/* Charts Side */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px]">
                <h2 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Flujo de Efectivo</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      formatter={(value: number) => `S/. ${value.toFixed(2)}`}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[350px]">
                <h2 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Gastos por Categoría</h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `S/. ${value.toFixed(2)}`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm italic">
                    Sin gastos registrados este mes
                  </div>
                )}
              </div>
            </div>

            {/* List & Export */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <i className="fas fa-list-ul text-slate-400"></i>
                  Últimos Movimientos
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={exportPDF}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <i className="fas fa-file-pdf text-rose-500"></i> PDF
                  </button>
                  <button 
                    onClick={exportExcel}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <i className="fas fa-file-excel text-emerald-500"></i> Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{t.date}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.description}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-tight">
                              {t.category}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}S/. {t.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => deleteTransaction(t.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                          No hay movimientos para este periodo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2024 Gastoxpress - Control financiero moderno con IA.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
