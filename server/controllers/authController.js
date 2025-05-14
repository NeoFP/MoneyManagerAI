const User = require("../models/User");

// Register a new user
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Create a new user (in a real app, you'd hash the password)
    const newUser = new User({
      email,
      password, // Note: In a real app, NEVER store plain text passwords
      name: name || "",
    });

    // Save user to database
    const savedUser = await newUser.save();
    console.log("User saved to database:", savedUser);

    // Remove password from response
    const userResponse = {
      _id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      createdAt: savedUser.createdAt,
    };

    return res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password (simple comparison for this demo)
    // In a real app, you'd compare hashed passwords
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create user response without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
    };

    return res.status(200).json({
      message: "Login successful",
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message });
  }
};
