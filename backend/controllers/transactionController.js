const Transaction = require('../models/Transaction');
const axios = require('axios');

// Initialize database with seed data
exports.initializeDatabase = async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.deleteMany({});
        await Transaction.insertMany(response.data);
        res.status(200).json({ message: 'Database initialized' });
    } catch (error) {
        res.status(500).json({ message: 'Error initializing database', error });
    }
};

// List all transactions with search and pagination
exports.listTransactions = async (req, res) => {
    const { month, year, search, page = 1, perPage = 10 } = req.query;
    const startDate = new Date(`${month} 1, ${year}`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const regex = new RegExp(search, 'i'); 

    try {
        const transactions = await Transaction.find({
            dateOfSale: { $gte: startDate, $lt: endDate },
            $or: [
                { title: { $regex: regex } },
                { description: { $regex: regex } }
            ]
        })
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions', error);
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
};
// Fetch statistics
exports.getStatistics = async (req, res) => {
    const { month ,year} = req.query;
    const startDate = new Date(`${month} 1, ${year}`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    console.log(`Fetching statistics for month: ${month} ${year}`);
    console.log(`Start date: ${startDate}`);
    console.log(`End date: ${endDate}`);

    try {
        const statistics = await Transaction.aggregate([
            {
                $match: {
                    dateOfSale: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$price' },
                    totalSold: { $sum: { $cond: ['$sold', 1, 0] } },
                    totalNotSold: { $sum: { $cond: ['$sold', 0, 1] } }
                }
            }
        ]);

        console.log(`Statistics found: ${JSON.stringify(statistics)}`);

        if (statistics.length === 0) {
            return res.status(200).json({
                totalAmount: 0,
                totalSold: 0,
                totalNotSold: 0
            });
        }

        res.status(200).json(statistics[0]);
    } catch (error) {
        console.error('Error fetching statistics', error);
        res.status(500).json({ message: 'Error fetching statistics', error });
    }
};

// Fetch bar chart data
exports.getBarChart = async (req, res) => {
    const { month, year } = req.query;
    const startDate = new Date(`${month} 1, ${year}`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    console.log(`Fetching bar chart data for month: ${month}`);
    console.log(`Start date: ${startDate}`);
    console.log(`End date: ${endDate}`);

    try {
        const barChart = await Transaction.aggregate([
            {
                $match: {
                    dateOfSale: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                    default: "901-above",
                    output: {
                        count: { $sum: 1 }
                    }
                }
            }
        ]);

        console.log(`Bar chart data found: ${JSON.stringify(barChart)}`);

        if (barChart.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(barChart);
    } catch (error) {
        console.error('Error fetching bar chart data', error);
        res.status(500).json({ message: 'Error fetching bar chart data', error });
    }
};
// Fetch pie chart data
exports.getPieChart = async (req, res) => {
    const { month, year } = req.query;
    const startDate = new Date(`${month} 1, ${year}`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    console.log(`Fetching pie chart data for month: ${month}`);
    console.log(`Start date: ${startDate}`);
    console.log(`End date: ${endDate}`);

    try {
        const pieChart = await Transaction.aggregate([
            {
                $match: {
                    dateOfSale: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log(`Pie chart data found: ${JSON.stringify(pieChart)}`);

        if (pieChart.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(pieChart);
    } catch (error) {
        console.error('Error fetching pie chart data', error);
        res.status(500).json({ message: 'Error fetching pie chart data', error });
    }
};
