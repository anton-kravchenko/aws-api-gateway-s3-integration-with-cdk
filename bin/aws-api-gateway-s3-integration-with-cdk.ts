#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { AwsApiGatewayS3IntegrationWithCdkStack } from "../lib/aws-api-gateway-s3-integration-with-cdk-stack";

const app = new cdk.App();
new AwsApiGatewayS3IntegrationWithCdkStack(app, "AwsApiGatewayS3IntegrationWithCdkStack", {});
