import {v2 as cloudinary } from "cloudinary"
import fs from "fs"




    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET  
    });

    const uploadOnCloudinary = async (localFilePath) =>{
        try {
            if(!localFilePath)return null
            //upload the file on cloudinary
           const response =   await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })            
            //file has been uploaded successfull
            // console.log("file is uploaded on cloudinary",
            //     response.url
            // );
            // console.log(response);
            return response;
        } catch (error) {
            console.error("Cloudinary upload failed:",error.message);
            return null;
            
        }finally{
            fs.unlink(localFilePath,(err)=>{
                if(err){
                    if(err.code !=="ENOENT"){
                        console.error("Failed to delete local file:",localFilePath,err)
                    }
                }
            })
        }
    }
    

    export {uploadOnCloudinary}
    