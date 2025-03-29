package main

import (
    "log"
    "bundler/config"
    "bundler/controllers"
    "bundler/routes"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
)

func main() {
    config.LoadEnv() // 直接调用，不赋值

    r := gin.Default()
    r.SetTrustedProxies([]string{"127.0.0.1"})

    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"*"},
        AllowMethods:     []string{"GET", "POST", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * 60 * 60,
    }))

    userOpController, err := controllers.NewUserOpController()
    if err != nil {
        log.Fatalf("Failed to create UserOpController: %v", err)
    }

    publicKeyOracleController, err := controllers.NewPublicKeyOracleController()
    if err != nil {
        log.Fatalf("Failed to create PublicKeyOracleController: %v", err)
    }

    depositController, err := controllers.NewDepositController()
    if err != nil {
        log.Fatalf("Failed to create DepositController: %v", err)
    }

    routes.SetupRouter(r)
    routes.SetupUserOpRouter(r, userOpController)
    routes.SetupDepositRouter(r, depositController)
    routes.SetupPublicKeyOracleRouter(r, publicKeyOracleController)

    log.Printf("Starting server on :8080...")
    if err := r.Run(":8080"); err != nil {
        log.Fatalf("Failed to run server: %v", err)
    }
}