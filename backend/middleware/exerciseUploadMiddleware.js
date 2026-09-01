import multer from "multer"
import path from "path"
import fs from "fs"

/*
|--------------------------------------------------------------------------
| Upload Directory
|--------------------------------------------------------------------------
*/

const uploadDirectory =
  path.join(
    process.cwd(),
    "uploads",
    "exercises",
  )

/*
|--------------------------------------------------------------------------
| Make Sure Upload Directory Exists
|--------------------------------------------------------------------------
*/

if (
  !fs.existsSync(
    uploadDirectory,
  )
) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    },
  )
}

/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
|
| Files selected from the user's laptop or phone are physically saved
| inside:
|
| uploads/exercises/
|
|--------------------------------------------------------------------------
*/

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      callback,
    ) => {
      callback(
        null,
        uploadDirectory,
      )
    },

    filename: (
      req,
      file,
      callback,
    ) => {
      const extension =
        path.extname(
          file.originalname,
        ).toLowerCase()

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
          .replace(
            /-+/g,
            "-",
          )
          .replace(
            /^-|-$/g,
            "",
          )
          .toLowerCase()

      const safeBaseName =
        baseName ||
        "exercise-file"

      const uniqueName =
        `${safeBaseName}-${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}${extension}`

      callback(
        null,
        uniqueName,
      )
    },
  })

/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
*/

/*
 * Image formats accepted:
 *
 * JPG
 * JPEG
 * PNG
 * WEBP
 *
 * Video formats accepted:
 *
 * MP4
 * WEBM
 * MOV
 * AVI
 * MPEG
 */

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

const allowedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
]

/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const fileFilter = (
  req,
  file,
  callback,
) => {
  /*
  |--------------------------------------------------------------------------
  | Exercise Image
  |--------------------------------------------------------------------------
  */

  if (
    file.fieldname ===
    "image"
  ) {
    if (
      allowedImageTypes.includes(
        file.mimetype,
      )
    ) {
      return callback(
        null,
        true,
      )
    }

    return callback(
      new Error(
        "Invalid image file. Please upload a JPG, JPEG, PNG, or WEBP image.",
      ),
      false,
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Exercise Video
  |--------------------------------------------------------------------------
  */

  if (
    file.fieldname ===
    "video"
  ) {
    if (
      allowedVideoTypes.includes(
        file.mimetype,
      )
    ) {
      return callback(
        null,
        true,
      )
    }

    return callback(
      new Error(
        "Invalid video file. Please upload an MP4, WEBM, MOV, AVI, or MPEG video.",
      ),
      false,
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Unexpected Field
  |--------------------------------------------------------------------------
  */

  return callback(
    new multer.MulterError(
      "LIMIT_UNEXPECTED_FILE",
      file.fieldname,
    ),
    false,
  )
}

/*
|--------------------------------------------------------------------------
| Multer Configuration
|--------------------------------------------------------------------------
|
| Image:
| Maximum 5 MB
|
| Video:
| Maximum 50 MB
|
|--------------------------------------------------------------------------
*/

const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      files: 2,

      fieldNameSize: 100,

      fieldSize:
        10 * 1024 * 1024,

      fileSize:
        50 * 1024 * 1024,
    },
  })

/*
|--------------------------------------------------------------------------
| Exercise Upload Middleware
|--------------------------------------------------------------------------
|
| The frontend must send:
|
| image -> picture file
| video -> video file
|
| Both are optional.
|
|--------------------------------------------------------------------------
*/

const exerciseUploadMiddleware =
  (req, res, next) => {
    upload.fields([
      {
        name: "image",
        maxCount: 1,
      },

      {
        name: "video",
        maxCount: 1,
      },
    ])(
      req,
      res,
      (error) => {
        if (error) {
          /*
          |--------------------------------------------------------------------------
          | Multer Errors
          |--------------------------------------------------------------------------
          */

          if (
            error instanceof
            multer.MulterError
          ) {
            if (
              error.code ===
              "LIMIT_FILE_SIZE"
            ) {
              return res.status(400).json({
                success: false,
                message:
                  "File is too large. Images must be 5 MB or less and videos must be 50 MB or less.",
              })
            }

            if (
              error.code ===
              "LIMIT_FILE_COUNT"
            ) {
              return res.status(400).json({
                success: false,
                message:
                  "You can upload a maximum of one image and one video.",
              })
            }

            if (
              error.code ===
              "LIMIT_UNEXPECTED_FILE"
            ) {
              return res.status(400).json({
                success: false,
                message:
                  "Unexpected upload field. Please use the image and video upload controls.",
              })
            }

            return res.status(400).json({
              success: false,
              message:
                error.message ||
                "Unable to process uploaded file.",
            })
          }

          /*
          |--------------------------------------------------------------------------
          | File Type Errors
          |--------------------------------------------------------------------------
          */

          return res.status(400).json({
            success: false,
            message:
              error.message ||
              "Unable to upload file.",
          })
        }

        /*
        |--------------------------------------------------------------------------
        | Successful Upload
        |--------------------------------------------------------------------------
        */

        next()
      },
    )
  }

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default exerciseUploadMiddleware