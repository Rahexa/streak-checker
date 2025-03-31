const express = require('express');
const axios = require('axios');
const app = express();

app.get('/api/streak-check', async (req, res) => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const today = new Date(now);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime() / 1000;
    const endOfDay = Math.floor(Date.now() / 1000);

    try {
        const response = await axios.get('https://codeforces.com/api/user.status?handle=Rahi_PUC');
        const submissions = response.data.result;

        const solvedToday = submissions.some(sub => 
            sub.verdict === "OK" && 
            sub.creationTimeSeconds >= startOfDay && 
            sub.creationTimeSeconds <= endOfDay
        );

        const recentSubmission = submissions
            .filter(sub => sub.verdict === "OK")
            .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)[0];
        const lastActiveTimestamp = recentSubmission ? recentSubmission.creationTimeSeconds : 0;
        const lastActiveDate = lastActiveTimestamp ? new Date(lastActiveTimestamp * 1000).toLocaleDateString("en-US", { timeZone: "Asia/Dhaka" }) : "Never";

        res.status(200).json({
            solvedToday: solvedToday,
            date: today.toLocaleDateString("en-US", { timeZone: "Asia/Dhaka" }),
            lastActive: lastActiveDate,
            lastActiveTimestamp: lastActiveTimestamp
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

app.use(express.static('public'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
