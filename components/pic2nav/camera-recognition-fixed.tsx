                    <Upload className="w-16 h-16 text-teal-500/80 dark:text-teal-400/80" />
                  </div>
                </motion.div>

                <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Upload a Photo
                </h2>

                <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-xs text-center text-sm">
                  Select an image from your device to identify the location
                </p>

                <div className="flex items-center justify-center mb-4 space-x-2">
                  <Switch id="fast-mode-upload" checked={fastMode} onCheckedChange={toggleFastMode} />
                  <Label htmlFor="fast-mode-upload" className="flex items-center cursor-pointer">
                    <Zap className={`h-4 w-4 mr-1 ${fastMode ? "text-amber-500" : "text-slate-400"}`} />
                    <span className={fastMode ? "text-amber-500 font-medium" : "text-slate-500"}>
                      {fastMode ? "Quick mode (10-15s)" : "Detailed mode (30s+)"}
                    </span>
                  </Label>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-xs"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 rounded-xl"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Select Photo
                  </Button>
                </motion.div>