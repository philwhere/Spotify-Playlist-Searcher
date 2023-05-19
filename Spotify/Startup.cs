using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Polly;
using Polly.Extensions.Http;
using Spotify.Configuration;
using Spotify.Services;
using Spotify.Services.Interfaces;
using System;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;

namespace Spotify
{
    public class Startup
    {
        public IConfiguration Configuration { get; set; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<CookiePolicyOptions>(options =>
            {
                // This lambda determines whether user consent for non-essential cookies is needed for a given request.
                options.CheckConsentNeeded = context => true;
                options.MinimumSameSitePolicy = SameSiteMode.None;
            });

            //services.AddMemoryCache();
            services.AddControllersWithViews().AddRazorRuntimeCompilation();
            services.AddRazorPages();
            services.AddHealthChecks();

            services.Configure<SpotifyClientConfiguration>(Configuration.GetSection("SpotifyClientConfiguration"));

            services.AddHttpClient<ISpotifyClient, SpotifyClientWithSemaphore>().AddPolicyHandler(GetRetryPolicy());
            services.AddTransient<SpotifyRequestPagingCalculator>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseCookiePolicy();

            app.UseRouting();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapRazorPages();
                endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
                endpoints.MapHealthChecks("/health", new HealthCheckOptions());
            });
            //app.UseMvc(routes =>
            //{
            //    routes.MapRoute(
            //        name: "default",
            //        template: "{controller=Home}/{action=Index}/{id?}");
            //});

            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", true, true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", true, true)
                .AddEnvironmentVariables();

            Configuration = builder.Build();
        }


        private IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
        {
            var jitter = new Random();
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(msg =>
                    msg.StatusCode == HttpStatusCode.TooManyRequests ||
                    msg.StatusCode == HttpStatusCode.NotFound)
                .WaitAndRetryAsync(
                    retryCount: 10,
                    sleepDurationProvider: (retryAttempt, response, context) =>
                    {
                        var headers = response.Result.Headers;
                        var guidanceProvided = headers.TryGetValues("Retry-After", out var providedRetryInSeconds);
                        var retryAfterInSeconds =
                            guidanceProvided ? int.Parse(providedRetryInSeconds.First()) : retryAttempt;
                        return TimeSpan.FromSeconds(retryAfterInSeconds) +
                               TimeSpan.FromMilliseconds(jitter.Next(111, 333));
                    },
                    onRetryAsync: (response, waitingTime, retryCount, context) =>
                    {
                        Debug.WriteLine(
                            $"Waited for {waitingTime.TotalMilliseconds} retrying\n{response.Result.RequestMessage.RequestUri}");
                        return Task.CompletedTask;
                    });
        }
    }
}
