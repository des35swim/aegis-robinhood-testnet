#!/bin/bash

cd web
npm run build

cd ../infra
./node_modules/.bin/cdk deploy AegisFeedbackPoc \
  --profile aegis-poc \
  -c budgetEmail=andrewcrme21@gmail.com \
  -c monthlyBudgetUsd=5

