# DID后端

## Installation


### 1. 将 `manifest/sql/create.sql` 导入数据库

### 2. 更新 `manifest/config/config.yaml` 与 `hack\config.yaml`的数据库配置

### 3. 运行 `go run main.go`, 如果在命令行看到路由信息则运行成功:

### 4. 在运行成功访问 `http://127.0.0.1:8000/swagger/` 可找到接口文档
```
  ADDRESS | METHOD |         ROUTE         |                                       HANDLER                                        |        MIDDLEWARE
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | ALL    | /*                    | github.com/gogf/gf/v2/net/ghttp.internalMiddlewareServerTracing                      | GLOBAL MIDDLEWARE
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | ALL    | /*                    | github.com/gogf/gf/v2/net/ghttp.MiddlewareHandlerResponse                            | GLOBAL MIDDLEWARE
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | ALL    | /api.json             | github.com/gogf/gf/v2/net/ghttp.(*Server).openapiSpec                                |
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | ALL    | /swagger/*            | github.com/gogf/gf/v2/net/ghttp.(*Server).swaggerUI                                  | HOOK_BEFORE_SERVE
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | POST   | /user/check-nick-name | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).CheckNickName | service.IMiddleware.Ctx   
          |        |                       |                                                                                      | ghttp.MiddlewareCORS      
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | POST   | /user/check-passport  | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).CheckPassport | service.IMiddleware.Ctx   
          |        |                       |                                                                                      | ghttp.MiddlewareCORS      
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | POST   | /user/is-signed-in    | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).IsSignedIn    | service.IMiddleware.Ctx   
          |        |                       |                                                                                      | ghttp.MiddlewareCORS      
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | GET    | /user/profile         | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).Profile       | service.IMiddleware.Ctx
          |        |                       |                                                                                      | ghttp.MiddlewareCORS
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | GET    | /user/profile         | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).Profile       | service.IMiddleware.Ctx
          |        |                       |                                                                                      | ghttp.MiddlewareCORS
          |        |                       |                                                                                      | service.IMiddleware.Auth
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | POST   | /user/sign-in         | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).SignIn        | service.IMiddleware.Ctx
          |        |                       |                                                                                      | ghttp.MiddlewareCORS
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | POST   | /user/sign-out        | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).SignOut       | service.IMiddleware.Ctx
          |        |                       |                                                                                      | ghttp.MiddlewareCORS
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
  :8000   | POST   | /user/sign-up         | github.com/gogf/gf-demo-user/v2/internal/controller/user.(*Controller).SignUp        | service.IMiddleware.Ctx
          |        |                       |                                                                                      | ghttp.MiddlewareCORS
----------|--------|-----------------------|--------------------------------------------------------------------------------------|---------------------------
```



# GoFrame Sites

### GoFrame Repo

* [https://github.com/gogf/gf](https://github.com/gogf/gf)

### GoFrame Home

* [https://goframe.org](https://goframe.org) (中文)
