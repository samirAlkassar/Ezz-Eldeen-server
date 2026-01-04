import cloudinary from "../utilities/cloudinary.js";
import User from "../models/User.js";


export const register = async (req, res) => {
  try {
    let pictureUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload_stream(
        { folder: "users" },
        (error, uploadResult) => {
          if (error) {
            console.error(error);
            return res.status(500).json({ message: "Image upload failed" });
          }
          pictureUrl = uploadResult.secure_url;
        }
      );

      // pipe the file buffer to cloudinary
      streamifier.createReadStream(req.file.buffer).pipe(result);
    }

    const newUser = new User({
      ...req.body,
      picturePath: pictureUrl, // save Cloudinary URL
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
