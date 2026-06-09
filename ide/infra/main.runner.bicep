// Contributor-deployable runner: the sandbox image as a plain Container App.
//
// Why this exists: Dynamic Sessions require the 'Session Executor' role, which
// a Contributor cannot grant — so we can't use the session pool. A regular
// Container App needs only ACR pull (admin creds), no role assignment.
//
// Scope of this variant:
//   • Runs Python/RAG lesson code via the /run endpoint. Each request runs in
//     a fresh temp dir and is cleaned up, so requests don't share files.
//   • Does NOT do LLM calls. Bifrost sits behind a WAF that only allows the
//     LHIND network, not Azure egress — so LLM runs in the browser instead.
//   • Single shared container (not per-user Hyper-V isolation). Acceptable for
//     internal, authenticated users; harden later if exposure widens.

@description('Location.')
param location string = resourceGroup().location

@description('Short prefix for resource names.')
@minLength(5)
@maxLength(20)
param namePrefix string = 'lhindide'

@description('ACR login server holding the runner image.')
param acrLoginServer string

@description('ACR admin username.')
param acrUsername string

@description('ACR admin password.')
@secure()
param acrPassword string

@description('Runner image tag.')
param runnerImageTag string = 'latest'

@description('Max replicas (each handles many sequential runs).')
param maxReplicas int = 10

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-logs'
  location: location
  properties: { sku: { name: 'PerGB2018' }, retentionInDays: 30 }
}

resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource runner 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${namePrefix}-runner'
  location: location
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'auto'
        // The lesson site (browser) calls /run cross-origin.
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        { server: acrLoginServer, username: acrUsername, passwordSecretRef: 'acr-pw' }
      ]
      secrets: [ { name: 'acr-pw', value: acrPassword } ]
    }
    template: {
      containers: [
        {
          name: 'runner'
          image: '${acrLoginServer}/lesson-runner:${runnerImageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [ { name: 'RUN_TIMEOUT_S', value: '120' } ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scale'
            http: { metadata: { concurrentRequests: '20' } }
          }
        ]
      }
    }
  }
}

output runnerFqdn string = runner.properties.configuration.ingress.fqdn
