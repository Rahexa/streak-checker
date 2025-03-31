const express = require('express');
const axios = require('axios');
const path = require('path');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint
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

        const result = {
            solvedToday: solvedToday,
            date: today.toLocaleDateString("en-US", { timeZone: "Asia/Dhaka" }),
            lastActive: lastActiveDate,
            lastActiveTimestamp: lastActiveTimestamp
        };

        res.status(200).json(result);
        return result;
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
        return null;
    }
});

// Email setup with nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sikderraihan110@gmail.com',
        pass: 'hufh hgfg lcxd lbta'
    }
});

// Function to check streak and send email
const checkStreakAndEmail = async (alertTime) => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const today = new Date(now);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime() / 1000;
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 604800;

    try {
        const response = await axios.get('https://codeforces.com/api/user.status?handle=Rahi_PUC');
        const submissions = response.data.result;

        const solvedToday = submissions.some(sub => 
            sub.verdict === "OK" && 
            sub.creationTimeSeconds >= startOfDay
        );
        const recentSubmission = submissions
            .filter(sub => sub.verdict === "OK")
            .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)[0];
        const lastActiveTimestamp = recentSubmission ? recentSubmission.creationTimeSeconds : 0;

        if (!solvedToday && lastActiveTimestamp > sevenDaysAgo) {
            const mailOptions = {
                from: 'sikderraihan110@gmail.com',
                to: 'sikderraihan693@gmail.com',
                subject: `Streak Alert: ${alertTime} Warning!`,
                text: `Hey Rahi, it’s ${alertTime} on ${today.toLocaleDateString("en-US", { timeZone: "Asia/Dhaka" })} and you haven’t solved a problem today. You were last active on ${new Date(lastActiveTimestamp * 1000).toLocaleDateString("en-US", { timeZone: "Asia/Dhaka" })}. Solve one now! - Streak Bot`
            };

            await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully at ${alertTime}`);
        } else {
            console.log(`No email needed at ${alertTime}: Solved today or inactive > 7 days`);
        }
    } catch (error) {
        console.error(`Error checking streak or sending email at ${alertTime}:`, error);
    }
};

// Schedule alerts
// 9:00 PM Asia/Dhaka = 15:00 UTC
cron.schedule('0 15 * * *', () => checkStreakAndEmail('9:00 PM'), {
    timezone: "UTC"
});

// 11:30 PM Asia/Dhaka = 17:30 UTC
cron.schedule('30 17 * * *', () => checkStreakAndEmail('11:30 PM'), {
    timezone: "UTC"
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Cron jobs scheduled for 9:00 PM and 11:30 PM Asia/Dhaka');
});
