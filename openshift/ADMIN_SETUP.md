# Curriculum Admin deployment contract

The admin is fail-closed in production. The enterprise SSO proxy in front of
the OpenShift route must remove client-supplied identity headers and inject:

- `x-forwarded-user`: stable corporate username
- `x-forwarded-groups`: comma-separated enterprise groups
- `x-admin-proxy-token`: the exact value stored as `ADMIN_TRUSTED_PROXY_TOKEN`

The application maps those groups to `editor`, `reviewer`, and `publisher`
through `ADMIN_ROLES_JSON`. Higher roles inherit lower-role capabilities.
`ADMIN_DEV_MODE=true` bypasses the proxy contract only for local development
and must never be set in the production Deployment.

GitLab uses a least-privilege project access token. It needs permission to
create `curriculum/change-*` branches, commit the four LRN manifest and
compatibility files, and open merge requests. It must not be able to push to
protected `main` directly. Publication becomes effective only when GitLab
reports the merge request as merged.

Apply the persistent volume before the Deployment:

```bash
oc apply -f openshift/admin-data-pvc.yaml
oc apply -f openshift/deployment.yaml
```

The PVC retains draft snapshots, chat traces, audit events, and revision
history across `Recreate` deployments. Git remains the source of truth for
published curriculum content.
