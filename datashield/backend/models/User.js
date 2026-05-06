import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // Email is used for login and must be unique
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Store the hashed password (never plain text)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // Role controls user permissions in the platform
    role: {
      type: String,
      enum: ["admin", "analyst", "developer"],
      default: "developer",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
