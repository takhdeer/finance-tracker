import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function SpendingCharts({ expenses }) {
    //by category
    const categoryData = expenses.reduce((acc, expense) => {
        const category = expense.category;
        const amount = parseFloat(expense.amount);

        const existing = acc.find(item => item.name === category);
        if (existing) {
            existing.value += amount;
        }
        else {
            acc.push({name: category, value: amount});
        }
        return acc;
    }, []);

    const dateData = expenses.reduce((acc, expense) => {
        const date = new Date(expense.date).toISOString().split('T')[0];
        const amount = parseFloat(expense.amount);

        const existing = acc.find(item => item.date === date);
        if (existing) { 
            existing.amount += amount;
        }
        else { 
            acc.push({date, amount});
        }
        return acc;
    }, [])
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .map(item => ({
        ...item,
        amount: parseFloat(item.amount.toFixed(2))
    }));

    const COLORS = ['#ff9800', '#2196F3', '#e91e63', '#f44336', '#9c27b0', '#757575'];

    if (expenses.length === 0) {
        return null;
    }

    return (
        <div style = {styles.container}>
            <h2>Spending Analytics</h2>

            {/* Spending by category */}
            <div style = {styles.chartBox}>
                <h3 style = {styles.chartTitle}>Spending by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx = "50%"
                            cy = "50%"
                            labelLine = {false}
                            label = {({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius = {80}
                            fill = "#8884d8"
                            dataKey = "value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key = {`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div style = {styles.legend}>
                    {categoryData.map((item, index) => (
                        <div key = {item.name} style = {styles.legendItem}>
                            <div style={{...styles.legendColor, backgroundColor: COLORS[index % COLORS.length]}}></div>
                            <span>{item.name}: ${item.value.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spending over time */}
            <div style = {styles.chartBox}>
                <h3 style = {styles.chartTitle}>Spending Over time</h3>
                <ResponsiveContainer width= "100%" height = {300}>
                    <LineChart data = {dateData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey = "date"
                            tick = {{fontSize: 12}}
                            angle = {-45}
                            textAnchor = "end"
                            height= {80}
                        />
                        <YAxis tick = {{fontSize: 12}} />
                        <Tooltip formatter = {(value) => `$${value}`} />
                            <Legend />
                            <Line 
                                type = "monotone" 
                                dataKey="amount" 
                                stroke="#4CAF50" 
                                strokeWidth={2}
                                name="Amount Spent"
                            />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px'
    },
      chartBox: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '30px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
    },
      chartTitle: {
        marginTop: 0,
        marginBottom: '20px',
        color: '#333',
        fontSize: '18px'
    },
      legend: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        marginTop: '20px',
        justifyContent: 'center'
    },
      legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px'
    },
      legendColor: {
        width: '16px',
        height: '16px',
        borderRadius: '3px'
    }
     
};

export default SpendingCharts;