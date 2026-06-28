cd /home/cicd/web/k8s
#git pull --quiet
kubectl apply -f deployment-beta.yaml -n zb-web-beta
kubectl delete configmap web-beta-conf -n zb-web-beta
kubectl create configmap web-beta-conf --from-file=conf-beta -n zb-web-beta
kubectl rollout restart deployment/zb-web-beta-deployment -n zb-web-beta
kubectl rollout status deployment/zb-web-beta-deployment -n zb-web-beta
