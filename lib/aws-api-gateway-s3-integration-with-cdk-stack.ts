import * as cdk from "@aws-cdk/core";
import * as S3 from "@aws-cdk/aws-s3";
import * as Iam from "@aws-cdk/aws-iam";
import * as ApiGateway from "@aws-cdk/aws-apigateway";

export class AwsApiGatewayS3IntegrationWithCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const assetsBucket = this.createAssetsBucket();

    const apiGateway = this.createAPIGateway();

    const executeRole = this.createExecutionRole();
    assetsBucket.grantReadWrite(executeRole);

    const s3Integration = this.createS3Integration(assetsBucket, executeRole);

    this.addAssetsEndpoint(apiGateway, s3Integration);
  }

  private createAssetsBucket() {
    return new S3.Bucket(this, "assets");
  }

  private createAPIGateway() {
    return new ApiGateway.RestApi(this, "assets-api", {
      restApiName: "Assets provider",
      description: "Serves assets from the S3 bucket.",
    });
  }

  private createExecutionRole() {
    const executeRole = new Iam.Role(this, "api-gateway-s3-assume-tole", {
      assumedBy: new Iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    executeRole.addToPolicy(
      new Iam.PolicyStatement({
        resources: ["*"],
        actions: ["s3:Get*"],
      }),
    );

    return executeRole;
  }

  private createS3Integration(assetsBucket: S3.Bucket, executeRole: Iam.Role) {
    return new ApiGateway.AwsIntegration({
      service: "s3",
      integrationHttpMethod: "GET",
      path: `${assetsBucket.bucketName}/{folder}/{key}`,
      options: {
        credentialsRole: executeRole,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": "integration.response.header.Content-Type",
            },
          },
        ],

        requestParameters: {
          "integration.request.path.folder": "method.request.path.folder",
          "integration.request.path.key": "method.request.path.key",
        },
      },
    });
  }

  private addAssetsEndpoint(
    apiGateway: ApiGateway.RestApi,
    s3Integration: ApiGateway.AwsIntegration,
  ) {
    apiGateway.root
      .addResource("assets")
      .addResource("{folder}")
      .addResource("{key}")
      .addMethod("GET", s3Integration, {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
            },
          },
        ],
        requestParameters: {
          "method.request.path.folder": true,
          "method.request.path.key": true,
          "method.request.header.Content-Type": true,
        },
      });
  }
}
