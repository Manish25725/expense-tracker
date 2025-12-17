package com.expensetracker.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller to handle Single Page Application (SPA) routing.
 * 
 * This controller forwards all non-API and non-static resource requests to index.html
 * so that Angular's client-side routing can handle them.
 * 
 * This is necessary because when a user refreshes the page or navigates directly to
 * an Angular route (e.g., /dashboard), the request goes to the server first.
 * Without this forwarding, the server would return a 404 error.
 * 
 * With this controller, the request is forwarded to index.html, which loads the
 * Angular app, and Angular's router takes over to display the correct component.
 */
@Controller
public class SpaController {

    /**
     * Forwards all routes that:
     * - Don't start with /api (our REST API endpoints)
     * - Don't have a file extension (static resources like .js, .css, .png, etc.)
     * 
     * to index.html for Angular routing.
     * 
     * The regex pattern explained:
     * - (?!api) - Negative lookahead: don't match if starts with "api"
     * - (?!.*\\.) - Negative lookahead: don't match if contains a dot (file extension)
     * - .* - Match any other path
     */
    @RequestMapping(value = {
        "/",
        "/{path:^(?!api$)(?!.*\\.).*$}",
        "/{path:^(?!api$)(?!.*\\.).*$}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
