#!/bin/zsh
set -e
set -u
set -o pipefail

BASE="/Users/simjimin/Downloads/final_develop/projec/backend"

pids=()
start_service() {
  local name="$1"
  local dir="$2"
  local url="$3"

  echo "[Starting] $name -> $url"
  (cd "$dir" && ASPNETCORE_ENVIRONMENT=Development dotnet run --no-launch-profile --urls "$url") &
  pids+=($!)
}

cleanup() {
  echo "\nStopping all services..."
  [[ ${#pids[@]} -gt 0 ]] && kill "${pids[@]}" 2>/dev/null || true
  wait
}
trap cleanup INT TERM

# 포트: Auth 5236 / User 5237 / Estimate 5135
start_service "AuthSystem" "$BASE/AuthSystem" "http://0.0.0.0:5236"
start_service "UserManagementSystem" "$BASE/UserManagementSystem" "http://0.0.0.0:5237"
start_service "EstimateRequestSystem" "$BASE/EstimateRequestSystem/EstimateRequestSystem" "http://0.0.0.0:5135"

wait