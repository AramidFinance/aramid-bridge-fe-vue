cd /home/cicd/web/k8s
#git pull --quiet
kubectl apply -f deployment-main.yaml -n aramid-web-main
kubectl delete configmap web-main-conf -n aramid-web-main
kubectl create configmap web-main-conf --from-file=conf-main -n aramid-web-main
kubectl rollout restart deployment/aramid-web-main-deployment -n aramid-web-main
kubectl rollout status deployment/aramid-web-main-deployment -n aramid-web-main
