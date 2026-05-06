const Scan = require('../models/Scan');
const Alert = require('../models/Alert');

exports.createScan = async (req, res) => {
  try {
    const { targetUrl } = req.body;
    const scan = new Scan({
      targetUrl,
      initiatedBy: req.user.userId,
      status: 'running'
    });
    await scan.save();

    // Simulate scanning process (in real implementation, this would be more complex)
    setTimeout(async () => {
      // Update scan status to completed
      scan.status = 'completed';
      await scan.save();
    }, 5000); // Simulate 5 seconds scan

    res.status(201).json(scan);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getScans = async (req, res) => {
  try {
    const scans = await Scan.find({ initiatedBy: req.user.userId }).sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};