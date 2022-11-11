from fastapi import FastAPI
from boto3 import Session

from generate import *
import PIL.Image

import firebase_admin
from firebase_admin import credentials
from firebase_admin import storage
from firebase_admin import firestore
import datetime

credFilePath = "ace-cycling-356912-d715a97c04be.json"
cred = credentials.Certificate(credFilePath)
default_app = firebase_admin.initialize_app(cred)
bucket = storage.bucket("ace-cycling-356912.appspot.com", default_app)
db = firestore.client()

app = FastAPI()
# バケット名,オブジェクト名
BUCKET_NAME = 'my-face-model'
OBJECT_KEY_NAME = 'styleGAN2_G_params.h5'

@app.get("/health")
async def get_health():
    return {"message": "OK"}

@app.post("/make_face/{u_id}")
async def update_face(u_id:str):
    num_layers = 18
    output_dir = 'results'
    latent_seed = 954 
    truncation_psi = 0.5
    noise_seed = 500
    batch_size = 1
    nn.load_parameters("styleGAN2_G_params.h5")

    rnd = np.random.RandomState(latent_seed)
    z = rnd.randn(batch_size, 512)

    nn.set_auto_forward(True) 
    style_noise = nn.NdArray.from_numpy_array(z)
    style_noises = [style_noise for _ in range(2)] 
    rgb_output = generate(batch_size, style_noises, noise_seed, mix_after=7, truncation_psi=truncation_psi) 

    images = convert_images_to_uint8(rgb_output, drange=[-1, 1])
    if not os.path.exists(output_dir):  # 無ければ
        os.makedirs(output_dir)
    # Display all the images
    for i in range(batch_size):
        filename = f'results/seed{latent_seed}_{i}.png'
        imsave(filename, images[i],channel_first=True)
        blob = bucket.blob(filename)
        blob.upload_from_filename(filename)
        blob.make_public()
        print(blob.public_url)
        print(u_id)
        city_ref = db.collection('Users').document(u_id)
        city_ref.update({
            'likeface_url': blob.public_url,
            'updatedAt':datetime.datetime.now()
        })
    return {"image_url": "ok"}