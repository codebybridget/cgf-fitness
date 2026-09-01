import multer from "multer"
import path from "path"
import fs from "fs"

/*
|--------------------------------------------------------------------------
| Upload directories
|--------------------------------------------------------------------------
*/

const uploadRoot =
  path.resolve(
    "uploads",
  )

const exerciseUploadDirectory =
  path.join(
    uploadRoot,
    "exercises",
  )

if (
  !fs.existsSync(
    exerciseUploadDirectory,
  )
) {
  fs.mkdirSync(
    exerciseUploadDirectory,
    {
      recursive: true,
    },
  )
}

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
*/

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb,
    ) => {
      cb(
        null,
        exerciseUploadDirectory,
      )
    },

    filename: (
      req,
      file,
      cb,
    ) => {
      const extension =
        path.extname(
          file.originalname,
        )

      const baseName =
        path
          .basename(
            file.originalname,
            extension,
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-",
          )

      const uniqueName =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}-${baseName}${extension}`

      cb(
        null,
        uniqueName,
      )
    },
  })

/*
|--------------------------------------------------------------------------
| File validation
|--------------------------------------------------------------------------
*/

const fileFilter =
  (
    req,
    file,
    cb,
  ) => {
    /*
    |----------------------------------------------------------------------
    | Exercise image
    |----------------------------------------------------------------------
    */

    if (
      file.fieldname ===
      "image"
    ) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ]

      if (
        allowedImageTypes.includes(
          file.mimetype,
        )
      ) {
        return cb(
          null,
          true,
        )
      }

      return cb(
        new Error(
          "Only JPG, PNG, WEBP and GIF images are allowed.",
        ),
        false,
      )
    }

    /*
    |----------------------------------------------------------------------
    | Exercise video
    |----------------------------------------------------------------------
    */

    if (
      file.fieldname ===
      "video"
    ) {
      const allowedVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
      ]

      if (
        allowedVideoTypes.includes(
          file.mimetype,
        )
      ) {
        return cb(
          null,
          true,
        )
      }

      return cb(
        new Error(
          "Only MP4, WEBM, MOV and AVI videos are allowed.",
        ),
        false,
      )
    }

    return cb(
      new Error(
        "Invalid upload field.",
      ),
      false,
    )
  }

/*
|--------------------------------------------------------------------------
| Exercise upload
|--------------------------------------------------------------------------
*/

const exerciseUpload =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        100 *
        1024 *
        1024,
    },
  })

export {
  exerciseUpload,
}