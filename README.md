# movingAverage

docker build --tag flask-nse-app .


docker network create my-network
docker run --name node-nse-app --net my-network -p 3000:3000 node-nse-app
docker run --name flask-nse-app --net my-network -p 5000:5000 flask-nse-app
