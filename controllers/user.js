import User from "../models/User.js";
import cloudinary from "../utilities/cloudinary.js";

export const getProfile = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const { firstName, lastName, email, phone, picturePath, role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          firstName,
          lastName,
          email,
          phone,
          picturePath,
          ...(role && { role })
        }
      },
      { new: true }
    ).select("-password");


    return res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to update user" });
  }
};


export const addAddress = async (req, res) => {
  try {
    const id = req.user.id;
    const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    };

    if (isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.push({
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault
    });

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to add address" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updated = req.body;
    const id = req.user.id;
    const user = await User.findById(id);

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // If setting new default, remove old default
    if (updated.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    Object.assign(address, updated);

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to update address" });
  }
};


export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const id = req.user.id;
    const user = await User.findById(id);

    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== addressId
    );

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete address" });
  }
};



export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // no file uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "users",
    });

    const imageUrl = result.secure_url;

    // update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { picturePath: imageUrl },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile picture updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Picture Error:", error);
    res.status(500).json({ message: "Error updating profile picture" });
  }
};
