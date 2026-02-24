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
    return res.status(401).json({ message: "Invalid token" });
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


//GET USERS + (filters and status)
export const getUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const query = {};
    if (search) query.$or = [{ firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } }];
    if (role) query.role = role;
    const sort = req.query.sort || "createdAt";
    const limit = req.query.limit || 10;
    const skip = req.query.skip || 0;
    const numberOfUsers = await User.countDocuments(query); // count total users
    const totalPages = Math.ceil(numberOfUsers / limit); // calculate total pages
    const users = await User.find(query).select("-password").sort({ [sort]: -1 }).limit(limit).skip(skip);
    const currentPage = skip / limit + 1;
    const hasMore = currentPage < totalPages; // check if there are more pages
    const numberOfnewUsersLastMonth = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    res.json({ users, numberOfUsers, totalPages, currentPage, hasMore, numberOfnewUsersLastMonth });
  } catch (error) {
    res.status(500).json({ message: "Failed to get users" });
  }
};


//Edit user role
export const editUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to edit user role" });
  }
};

// delete user 
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndDelete(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// add new User 
export const addNewUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const user = await User.create({ firstName, lastName, email, password, role });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to add new user" });
  }
};