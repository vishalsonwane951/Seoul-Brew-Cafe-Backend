import Staff from "../../models/staffModel.js";

// GET /api/staff
export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find().sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFilePaths = (files) => {
  const out = {};
  if (files?.photo?.[0]) {
    out.photoUrl = `/uploads/staff/${files.photo[0].filename}`;
  }
  if (files?.onboardedDocFile?.[0]) {
    out.onboardedDocUrl = `/uploads/staff/${files.onboardedDocFile[0].filename}`;
  }
  return out;
};

// POST /api/staff
export const createStaff = async (req, res) => {
  try {
    const body = { ...req.body };
    const filePaths = getFilePaths(req.files);

    const { name, role } = body;
    if (!name || !role) {
      return res
        .status(400)
        .json({ message: "Name and role are required fields" });
    }

    const schedule = Array.isArray(body.schedule)
      ? body.schedule
      : typeof body.schedule === "string" && body.schedule
        ? body.schedule.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 7)
        : [];

    const staff = await Staff.create({
      ...body,
      schedule,
      ...filePaths,
    });
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/staff/:id
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    const filePaths = getFilePaths(req.files);

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (body.schedule !== undefined) {
      body.schedule = Array.isArray(body.schedule)
        ? body.schedule
        : typeof body.schedule === "string" && body.schedule
          ? body.schedule.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 7)
          : [];
    }

    Object.assign(staff, body, filePaths);

    const updated = await staff.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/staff/:id
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Staff.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ message: "Staff member deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/staff/:id/status
export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const allowed = ["On Shift", "Day Off"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    staff.status = status;
    const updated = await staff.save();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

