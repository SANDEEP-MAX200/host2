import User from "../models/User.js";
import jwt from "jsonwebtoken";

import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

export const getPeriodAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, targetEmail } = req.query;
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Individual uses their own email; Corporate uses targetEmail (sub-user) or their own.
    const emailToQuery = targetEmail || decoded.email;
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");

    const user = await User.findOne({ email: emailToQuery });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Filter history based on scanned_at date
    const historyInPeriod = user.history.filter(item => {
      const scanDate = new Date(item.scanned_at);
      return scanDate >= start && scanDate <= end;
    });

    const totalScans = historyInPeriod.length;
    const potentiallyRisky = historyInPeriod.filter(item =>
      item.verdict === "potentially_risky" || item.verdict === "Potentially_risky"
    ).length;
    const unsafe = historyInPeriod.filter(item =>
      item.verdict === "Unsafe"
    ).length;
    const safe = historyInPeriod.filter(item =>
      item.verdict === "Safe"
    ).length;
    const blockedUnsafe = potentiallyRisky + unsafe;

    res.status(200).json({
      totalScans,
      blockedUnsafe,
      potentiallyRisky,
      unsafe,
      safe,
      period: { start, end }
    });
  } catch (error) {
    res.status(500).json({ message: "Analytics Error", error: error.message });
  }
};

export const exportAnalytics = async (req, res) => {
  try {
    const { type, dept, targetEmail, format } = req.query; // format: 'csv' or 'pdf'
    let query = {};

    // 1. Filter Logic
    if (targetEmail) {
      query = { email: targetEmail };
    } else if (dept) {
      query = { dept: dept };
    } else {
      const token = req.cookies.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET );
      query = { Parent: decoded.email };
    }

    const users = await User.find(query);

    // 2. Data Transformation
    const reportData = users.map(u => ({
      Name: u.name,
      Email: u.email,
      Department: u.dept,
      Total_Safe_Scans: u.count?.safe || 0,
      Total_Unsafe_Scans: u.count?.unsafe || 0,
      Total_Scans: (u.count?.safe || 0) + (u.count?.unsafe || 0)
    }));

    // 3. Export as CSV
    if (format === 'csv') {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(reportData);
      res.header('Content-Type', 'text/csv');
      res.attachment(`analytics_${new Date().getTime()}.csv`);
      return res.send(csv);
    }

    // 4. Export as PDF
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50, bufferPages: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${new Date().getTime()}.pdf`);
      doc.pipe(res);

      //Watermark Function
      const addWatermark = (pdfDoc) => {
        pdfDoc.save();
        pdfDoc.opacity(0.2); // Transparency

        // Correct path to your image asset
        const logoPath = "../public/AEVUS_logo_OR.png";

        try {
          // Translate to center of page and rotate for diagonal look
          pdfDoc.translate(300, 400);
          pdfDoc.rotate(-45);

          // Draw the image centered on the new (0,0) origin
          pdfDoc.image(logoPath, -110, -150, { width: 300 });
          console.log("Logo watermark added successfully");
        } catch (err) {
          console.log("Logo watermark error:", err);
          // Fallback to text watermark if image is missing
          pdfDoc.fontSize(80).text('AUVUS', -150, -40, { width: 300, align: 'center' });
        }

        pdfDoc.restore(); // Reset coordinates and opacity for main content
      };

      // Set up automatic watermark for new pages
      doc.on('pageAdded', () => {
        addWatermark(doc);
      });

      // Apply to first page manually
      addWatermark(doc);

      // Main Report Header
      doc.fillColor('#000000').fontSize(22).text('User Security Analytics Report', { align: 'center' });
      doc.moveDown(2);

      // --- USER LIST LOOP ---
      reportData.forEach((user, index) => {
        // Safe-guard: Start a new page if we are near the bottom
        if (doc.y > 650) {
          doc.addPage();
          doc.y = 50; // Reset Y cursor at top of new page
        }

        // Section Title (User Name)
        doc.fillColor('#1D4ED8').fontSize(14).text(`${index + 1}. ${user.Name}`, { continued: true });

        // Inline Email (Smaller and Gray)
        doc.fillColor('#6B7280').fontSize(10).text(`  (${user.Email})`);

        // Stats Details
        doc.moveDown(0.5);
        const statsX = 70;
        doc.fillColor('#374151').fontSize(11);
        doc.text(`Department: ${user.Department || 'N/A'}`, statsX);
        doc.text(`Safe Scans: ${user.Total_Safe_Scans}`, statsX);
        doc.text(`Unsafe Scans: ${user.Total_Unsafe_Scans}`, statsX);
        doc.text(`Total Scans: ${user.Total_Scans}`, statsX);

        // Visual Separator Line
        doc.moveDown(0.8);
        doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);
      });

      doc.end();
      return;
    }

    res.status(400).json({ message: "Invalid format specified" });
  } catch (error) {
    res.status(500).json({ message: "Export Error", error: error.message });
  }
};
