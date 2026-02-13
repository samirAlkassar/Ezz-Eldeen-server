import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import cloudinary from "../utilities/cloudinary.js";

export const register = async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "users", // better folder name for clarity
      });
      imageUrl = result.secure_url;
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      addresses, // plural — matches schema
    } = req.body;

    // ✅ Check for existing user before creating a new one
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phone,
      picturePath: imageUrl || "",
      addresses,
    });

    const savedUser = await newUser.save();

    // ✅ Return JWT on register (optional, for auto-login)
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // token expiry is a must
    );

    // remove password before sending
    const userToSend = savedUser.toObject();
    delete userToSend.password;

    res.status(201).json({ token, user: userToSend });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User does not exist." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password before sending
    const userToSend = user.toObject();
    delete userToSend.password;

    res.status(200).json({ token, user: userToSend, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
