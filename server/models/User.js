import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    username: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false, // This field will not be returned in queries by default
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  // If the password hasn't been modified, just return to let Mongoose continue
  if (!this.isModified("password")) {
    return; 
  }
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password before login, and this is for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;  // Exporting the User model to be used in other parts of the application jahan bhi User likhunga wahan user schema aa jayega, like in authController.js where we will use User.findOne() to find a user by email during login.
